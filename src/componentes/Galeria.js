import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Link, useNavigate } from 'react-router-dom'; // Añadido useNavigate
import imagenDeFondo from '../imagenes/fondo.jpg';
import { moderador } from './moderacion'; 

const ComentarioIndividual = ({ comentario, todosLosComentarios, alResponder, alBorrar, respondiendoA, enviarRespuesta, textoRespuesta, setTextoRespuesta, usuarioActualId, comentarioEditandoId, comentarioEditandoTexto, setComentarioEditandoId, setComentarioEditandoTexto, actualizarComentario }) => {
  const hijos = todosLosComentarios.filter(h => String(h.parent_id) === String(comentario.id));
  const nombreDisplay = comentario.perfiles?.nombre_completo || `Usuario ${comentario.usuario_id || 'Anónimo'}`;
  const avatarUrl = comentario.perfiles?.avatar_url || 'https://via.placeholder.com/40?text=U';
  const esPropio = String(comentario.usuario_id) === String(usuarioActualId);
  const estaEditando = String(comentarioEditandoId) === String(comentario.id);

  return (
    <div style={{ marginBottom: '10px', marginLeft: comentario.parent_id ? '30px' : '0px', borderLeft: comentario.parent_id ? '1px solid #444' : 'none', paddingLeft: comentario.parent_id ? '15px' : '0px' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:'10px', padding:'10px', borderBottom:'1px solid rgba(255,255,255,0.1)' }}>
        <img src={avatarUrl} style={estilos.miniAvatarComment} alt="avatar" />
        <div style={{ flex:1 }}>
          <strong style={{ fontSize:'0.8em', color:'#f07e11' }}>{nombreDisplay}</strong>
          {estaEditando ? (
            <div style={{ display:'flex', gap:'8px', alignItems:'center', marginTop:'6px' }}>
              <input
                value={comentarioEditandoTexto}
                onChange={(e) => setComentarioEditandoTexto(e.target.value)}
                style={{ ...estilos.inputComentario, fontSize:'0.85em', minWidth:'0' }}
              />
              <button onClick={() => actualizarComentario(comentario.id, comentarioEditandoTexto)} style={estilos.btnResponder}>💾</button>
              <button onClick={() => { setComentarioEditandoId(null); setComentarioEditandoTexto(''); }} style={estilos.btnBorrar}>✕</button>
            </div>
          ) : (
            <p style={{ fontSize:'0.9em', margin:'5px 0', color:'#fff', whiteSpace:'pre-wrap', overflowWrap:'anywhere', wordBreak:'break-all' }}>{comentario.contenido}</p>
          )}
          <div style={{ display:'flex', gap:'8px' }}>
            <button onClick={() => alResponder(comentario.id)} style={{ background:'#fff', color:'#000', border:'1px solid #444', borderRadius:'5px', fontSize:'0.75em', padding:'3px 8px', cursor:'pointer' }}>Responder</button>
            {esPropio && !estaEditando && (
              <button onClick={() => { setComentarioEditandoId(comentario.id); setComentarioEditandoTexto(comentario.contenido || ''); }} style={{ background:'#fff', color:'#000', border:'1px solid #444', borderRadius:'5px', fontSize:'0.75em', padding:'3px 8px', cursor:'pointer' }}>✏️</button>
            )}
          </div>
        </div>
        {esPropio && (
          <button onClick={() => alBorrar(comentario.id, comentario.usuario_id)} style={{ background:'none', border:'none', color:'#f00', cursor:'pointer' }}>🗑️</button>
        )}
      </div>

      {respondiendoA === comentario.id && (
        <div style={{ display:'flex', gap:'5px', margin:'8px 0 0 20px' }}>
          <input value={textoRespuesta} onChange={(e) => setTextoRespuesta(e.target.value)} style={{ flex:1, padding:'8px', borderRadius:'6px', border:'1px solid #555', background:'#111', color:'white' }} placeholder="Escribe tu respuesta..." />
          <button onClick={() => enviarRespuesta(comentario.id)} style={{ background:'#f07e11', border:'none', color:'white', borderRadius:'6px', padding:'8px 12px', cursor:'pointer' }}>➤</button>
        </div>
      )}

      {hijos.map(hijo => (
        <ComentarioIndividual key={hijo.id} comentario={hijo} todosLosComentarios={todosLosComentarios} alResponder={alResponder} alBorrar={alBorrar} respondiendoA={respondiendoA} enviarRespuesta={enviarRespuesta} textoRespuesta={textoRespuesta} setTextoRespuesta={setTextoRespuesta} usuarioActualId={usuarioActualId} comentarioEditandoId={comentarioEditandoId} comentarioEditandoTexto={comentarioEditandoTexto} setComentarioEditandoId={setComentarioEditandoId} setComentarioEditandoTexto={setComentarioEditandoTexto} actualizarComentario={actualizarComentario} />
      ))}
    </div>
  );
};

const Galeria = () => {
  const [proyectos, setProyectos] = useState([]);
  const [terminoBusqueda, setTerminoBusqueda] = useState('');
  const [tipoFiltro, setTipoFiltro] = useState('titulo'); 
  const [cargando, setCargando] = useState(true);
  const [busquedaRealizada, setBusquedaRealizada] = useState(false);
  const [userId, setUserId] = useState(null);

  const [proyectoSeleccionado, setProyectoSeleccionado] = useState(null);
  const [comentarios, setComentarios] = useState([]);
  const [nuevoComentario, setNuevoComentario] = useState('');
  const [enviandoComentario, setEnviandoComentario] = useState(false);
  const [respondiendoA, setRespondiendoA] = useState(null);
  const [textoRespuesta, setTextoRespuesta] = useState('');
  const [comentarioEditandoId, setComentarioEditandoId] = useState(null);
  const [comentarioEditandoTexto, setComentarioEditandoTexto] = useState('');

  const navigate = useNavigate(); // Hook para navegación

  useEffect(() => {
    inicializar();
  }, []);

  const inicializar = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    const currentId = user?.id || null;
    setUserId(currentId);
    fetchProyectosGlobales(false, currentId); 
  };

  const fetchProyectosGlobales = async (esBusqueda = false, idParaCarga = null) => {
    setCargando(true);
    // Usamos el ID pasado por parámetro o el que está en el estado
    const activeUserId = idParaCarga || userId;
    
    try {
      // 1. Iniciamos la consulta base
      let query = supabase
        .from('proyectos')
        .select(`
          id, titulo, archivo_url, tipo_archivo, usuario_id, creado_el,
          perfiles!inner ( nombre_completo, avatar_url ),
          likes ( usuario_id ),
          comentarios (count)
        `);

      // 2. Aplicamos filtros de búsqueda si existen
      if (esBusqueda && terminoBusqueda.trim() !== '') {
        const t = `%${terminoBusqueda.trim()}%`;
        if (tipoFiltro === 'titulo') {
          query = query.ilike('titulo', t);
        } else {
          query = query.ilike('perfiles.nombre_completo', t);
        }
        setBusquedaRealizada(true);
      } else {
        setBusquedaRealizada(false);
      }

      // 3. FILTRO CRÍTICO: No mostrar mis propias publicaciones
      // Solo se aplica si el usuario está logueado (activeUserId no es null)
      if (activeUserId) {
        query = query.not('usuario_id', 'eq', activeUserId);
      }

      // 4. Ordenar por fecha de creación (más recientes primero)
      const { data, error } = await query.order('creado_el', { ascending: false });
      
      if (error) throw error;

      // 5. Procesar los datos para saber si el usuario actual ya dio "Like"
      const proyectosProcesados = data.map(p => {
        const yaTieneMiLike = activeUserId ? p.likes?.some(l => l.usuario_id === activeUserId) : false;
        return {
          ...p,
          totalLikes: p.likes?.length || 0,
          totalComentarios: p.comentarios?.[0]?.count || 0,
          miLike: yaTieneMiLike 
        };
      });

      setProyectos(proyectosProcesados);
    } catch (err) {
      console.error("Error en Galería (Filtro Usuario):", err);
    } finally {
      setCargando(false);
    }
  };

  const abrirProyecto = (proyecto) => {
    setProyectoSeleccionado(proyecto);
    fetchComentarios(proyecto.id);
  };

  const fetchComentarios = async (proyectoId) => {
    const { data, error } = await supabase
      .from('comentarios')
      .select(`
        id, contenido, creado_el, usuario_id, parent_id, proyecto_id,
        perfiles ( id, nombre_completo, avatar_url )
      `)
      .eq('proyecto_id', proyectoId)
      .order('creado_el', { ascending: true });
    
    if (error) {
      console.error("Error al traer comentarios:", error.message);
    } else {
      console.log("Comentarios cargados:", data);
      setComentarios(data || []);
    }
  };

  const enviarComentario = async (e) => {
    e.preventDefault();
    if (!nuevoComentario.trim() || !userId || !proyectoSeleccionado?.id) return;

    if (nuevoComentario.trim().length > 150) {
      alert('⚠️ El comentario es demasiado largo (máximo 150 caracteres).');
      return;
    }

    // Validación prioritaria de texto con moderador
    const moderacion = await moderador.validarTexto(nuevoComentario.trim());
    if (!moderacion.seguro) {
      alert('❌ Comentario bloqueado: ' + (moderacion.razon || 'Contenido inapropiado detectado.'));
      console.log('Moderación Galería:', moderacion.detalle);
      return;
    }

    setEnviandoComentario(true);
    const { error } = await supabase
      .from('comentarios')
      .insert({
        proyecto_id: proyectoSeleccionado.id,
        usuario_id: userId,
        contenido: nuevoComentario.trim()
      });

    if (!error) {
      setNuevoComentario('');
      await fetchComentarios(proyectoSeleccionado.id);
    }
    setEnviandoComentario(false);
  };

  const enviarRespuesta = async (padreId) => {
    if (!proyectoSeleccionado?.id) {
      alert('Selecciona un proyecto para responder.');
      return;
    }

    if (!textoRespuesta.trim()) {
      alert('Escribe algo en la respuesta antes de enviar.');
      return;
    }

    if (textoRespuesta.trim().length > 150) {
      alert('⚠️ El comentario es demasiado largo (máximo 150 caracteres).');
      return;
    }

    // Moderación de la respuesta
    const moderacionRespuesta = await moderador.validarTexto(textoRespuesta.trim());
    if (!moderacionRespuesta.seguro) {
      alert('❌ Respuesta bloqueada: contenido inapropiado detectado.');
      return;
    }

    const { error } = await supabase
      .from('comentarios')
      .insert({
        proyecto_id: proyectoSeleccionado.id,
        usuario_id: userId,
        contenido: textoRespuesta.trim(),
        parent_id: padreId
      });

    if (!error) {
      setTextoRespuesta('');
      setRespondiendoA(null);
      await fetchComentarios(proyectoSeleccionado.id);
    } else {
      alert('Error al enviar respuesta: ' + error.message);
    }
  };

  const actualizarComentario = async (comentarioId, contenido) => {
    if (!contenido.trim()) {
      alert('El contenido no puede estar vacío.');
      return;
    }

    if (contenido.trim().length > 150) {
      alert('⚠️ El comentario es demasiado largo (máximo 150 caracteres).');
      return;
    }

    const { error } = await supabase
      .from('comentarios')
      .update({ contenido: contenido.trim() })
      .eq('id', comentarioId)
      .eq('usuario_id', userId);

    if (error) {
      alert('Error al actualizar comentario: ' + error.message);
      console.error(error);
      return;
    }

    setComentarios(prev => prev.map(c => c.id === comentarioId ? { ...c, contenido: contenido.trim() } : c));
    setComentarioEditandoId(null);
    setComentarioEditandoTexto('');
    if (proyectoSeleccionado?.id) await fetchComentarios(proyectoSeleccionado.id);
  };

  const borrarComentario = async (comentarioId) => {
    const confirmar = window.confirm('¿Estás seguro de que quieres eliminar este comentario?');
    if (!confirmar) return;

    const { error } = await supabase
      .from('comentarios')
      .delete()
      .eq('id', comentarioId)
      .eq('usuario_id', userId);

    if (error) {
      alert('Error al borrar comentario: ' + error.message);
      return;
    }

    setComentarios(prev => prev.filter(c => c.id !== comentarioId));
    if (proyectoSeleccionado?.id) await fetchComentarios(proyectoSeleccionado.id);
  };
  const eliminarComentario = async (comentarioId, autorId) => {
    if (!userId || String(autorId) !== String(userId)) return;

    if (window.confirm("¿Estás seguro de que quieres eliminar este comentario?")) {
      const { error } = await supabase
        .from('comentarios')
        .delete()
        .eq('id', comentarioId);

      if (!error) {
        setComentarios(prev => prev.filter(c => c.id !== comentarioId));
      } else {
        alert("Error al eliminar comentario: " + error.message);
      }
    }
  };

  const manejarLike = async (e, proyectoId, yaTieneLike) => {
    e.stopPropagation(); 
    const activeId = userId;
    if (!activeId) return;

    setProyectos(prev => prev.map(p => p.id === proyectoId ? 
      { ...p, miLike: !yaTieneLike, totalLikes: yaTieneLike ? p.totalLikes - 1 : p.totalLikes + 1 } : p
    ));

    if (yaTieneLike) {
      await supabase.from('likes').delete().match({ usuario_id: activeId, proyecto_id: proyectoId });
    } else {
      await supabase.from('likes').insert({ usuario_id: activeId, proyecto_id: proyectoId });
    }
  };

  const resetearGaleria = () => {
    setTerminoBusqueda('');
    setBusquedaRealizada(false);
    fetchProyectosGlobales(false); 
  };

  return (
    <div style={{...estilos.padre, ...estilos.fondoConImagen}}>
      <div style={estilos.panelPrincipal}>
        <nav style={estilos.nav}>
          <h1 style={estilos.logotipo}>Explorer</h1>
          <div style={estilos.contenedorBusqueda}>
            <select value={tipoFiltro} onChange={(e) => setTipoFiltro(e.target.value)} style={estilos.selector}>
              <option value="titulo">Proyecto</option>
              <option value="usuario">Usuario</option>
            </select>
            <input 
              type="text" 
              placeholder="Buscar..." 
              value={terminoBusqueda}
              onChange={(e) => setTerminoBusqueda(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchProyectosGlobales(true)}
              style={estilos.buscador} 
            />
            <button onClick={() => fetchProyectosGlobales(true)} style={estilos.btnBuscar}>🔍</button>
            {busquedaRealizada && <button onClick={resetearGaleria} style={estilos.btnVolverMini}>✕</button>}
          </div>
          <Link to="/dashboard" style={estilos.btnPerfil}>👤 Mi Perfil</Link>
        </nav>

        <div style={estilos.grid}>
          {proyectos.map((obra) => (
            <div key={obra.id} style={estilos.tarjeta}>
              {/* Click en la media abre el modal */}
              <div style={estilos.contenedorMedia} onClick={() => abrirProyecto(obra)}>
                {obra.tipo_archivo === 'video' ? 
                  <video src={obra.archivo_url} style={estilos.media} /> : 
                  <img src={obra.archivo_url} style={estilos.media} alt="" />
                }
              </div>

              <button 
                onClick={(e) => manejarLike(e, obra.id, !!obra.miLike)}
                style={{
                  ...estilos.btnLike, 
                  color: obra.miLike ? '#ff4b2b' : '#fff'
                }}
              >
                {obra.miLike ? '❤️' : '🤍'} <span>{obra.totalLikes}</span>
              </button>

              <div style={estilos.footerTarjeta}>
                <h3 style={estilos.tituloObra} onClick={() => abrirProyecto(obra)}>{obra.titulo}</h3>
                <div style={{ marginTop:'8px', display:'flex', alignItems:'center', gap:'10px', color:'#222' }}>
                  <span style={{ display:'inline-flex', alignItems:'center', background:'#fff', borderRadius:'12px', padding:'3px 8px', gap:'4px', fontSize:'0.85em' }}>❤️ {obra.totalLikes}</span>
                  <span style={{ display:'inline-flex', alignItems:'center', background:'#fff', borderRadius:'12px', padding:'3px 8px', gap:'4px', fontSize:'0.85em' }}>💬 {obra.totalComentarios}</span>
                </div>
                {/* CLICK AQUÍ ENVÍA AL PERFIL DEL USUARIO */}
                <div 
                  style={{...estilos.autorInfo, cursor: 'pointer'}} 
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/perfil/${obra.usuario_id}`);
                  }}
                >
                  <img src={obra.perfiles?.avatar_url || "https://via.placeholder.com/30"} style={estilos.miniAvatar} alt="" />
                  <span style={estilos.nombreAutor}>{obra.perfiles?.nombre_completo}</span>
                </div>
              </div>              <div style={{ marginTop:'8px', display:'flex', gap:'10px', alignItems:'center' }}>
                <span style={{ background: '#111', color: '#fff', borderRadius: '12px', padding: '4px 8px', fontSize: '0.85em', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                  ❤️ {obra.totalLikes ?? 0}
                </span>
                <span style={{ background: '#111', color: '#fff', borderRadius: '12px', padding: '4px 8px', fontSize: '0.85em', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                  💬 {obra.totalComentarios ?? obra.comentarios?.[0]?.count ?? 0}
                </span>
              </div>            </div>
          ))}
        </div>
      </div>

      {/* MODAL */}
      {proyectoSeleccionado && (
        <div style={estilos.overlay} onClick={() => setProyectoSeleccionado(null)}>
          <div style={estilos.modal} onClick={e => e.stopPropagation()}>
            <div style={estilos.modalContent}>
              <div style={estilos.modalMedia}>
                {proyectoSeleccionado.tipo_archivo === 'video' ? 
                  <video src={proyectoSeleccionado.archivo_url} controls style={estilos.mediaFull} /> : 
                  <img src={proyectoSeleccionado.archivo_url} style={estilos.mediaFull} alt="" />
                }
              </div>
              <div style={estilos.modalSide}>
                <button style={estilos.btnClose} onClick={() => setProyectoSeleccionado(null)}>✕</button>
                <h2 style={estilos.modalTitulo}>{proyectoSeleccionado.titulo}</h2>
                <p style={{ color: '#ccc', margin: '5px 0 12px 0', fontSize: '0.9em' }}>
                  {comentarios.length} comentario{comentarios.length === 1 ? '' : 's'}
                </p>
                <div style={estilos.listaComentarios}>
                  {comentarios.filter(c => !c.parent_id).map(c => (
                    <ComentarioIndividual 
                      key={c.id}
                      comentario={c}
                      todosLosComentarios={comentarios}
                      alResponder={setRespondiendoA}
                      alBorrar={eliminarComentario}
                      respondiendoA={respondiendoA}
                      enviarRespuesta={enviarRespuesta}
                      textoRespuesta={textoRespuesta}
                      setTextoRespuesta={setTextoRespuesta}
                      usuarioActualId={userId}
                      comentarioEditandoId={comentarioEditandoId}
                      comentarioEditandoTexto={comentarioEditandoTexto}
                      setComentarioEditandoId={setComentarioEditandoId}
                      setComentarioEditandoTexto={setComentarioEditandoTexto}
                      actualizarComentario={actualizarComentario}
                    />
                  ))}

                </div>
                <form onSubmit={enviarComentario} style={estilos.formComentario}>
                  <input 
                    style={estilos.inputComentario}
                    placeholder="Escribe un comentario..."
                    value={nuevoComentario}
                    onChange={(e) => setNuevoComentario(e.target.value)}
                  />
                  <button type="submit" disabled={enviandoComentario} style={estilos.btnEnviar}>
                    {enviandoComentario ? '...' : '➤'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const estilos = {
  padre: { height: '100vh', width: '100vw', display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  fondoConImagen: { backgroundImage: `url(${imagenDeFondo})`, backgroundSize: 'cover', backgroundPosition: 'center' },
  panelPrincipal: { backgroundColor: 'rgba(15, 15, 15, 0.94)', width: '90%', maxWidth: '1200px', height: '85vh', padding: '30px', borderRadius: '25px', display: 'flex', flexDirection: 'column', border: '1px solid #333' },
  nav: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', borderBottom: '1px solid #444', paddingBottom: '15px' },
  logotipo: { color: '#f07e11', fontSize: '24px', fontWeight: 'bold' },
  contenedorBusqueda: { display: 'flex', gap: '5px', width: '45%', background: '#111', padding: '5px', borderRadius: '15px', border: '1px solid #444' },
  selector: { background: '#222', color: '#fff', border: 'none', borderRadius: '10px', padding: '0 5px' },
  buscador: { flex: 1, background: 'transparent', border: 'none', padding: '10px', color: '#fff', outline: 'none' },
  btnBuscar: { background: '#f07e11', border: 'none', borderRadius: '10px', padding: '0 15px', cursor: 'pointer' },
  btnVolverMini: { background: '#333', color: '#fff', border: 'none', borderRadius: '10px', padding: '0 10px', cursor: 'pointer' },
  btnPerfil: { textDecoration: 'none', background: '#f07e11', color: '#000', padding: '10px 20px', borderRadius: '12px', fontWeight: 'bold' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px', overflowY: 'auto', padding: '10px', alignContent: 'start' },
  tarjeta: { background: '#1a1a1a', borderRadius: '18px', overflow: 'visible', border: '1px solid #333', position: 'relative' },
  contenedorMedia: { width: '100%', height: '180px', backgroundColor: '#000', position: 'relative', overflow: 'hidden', borderRadius: '18px 18px 0 0', cursor: 'pointer' },
  media: { width: '100%', height: '100%', objectFit: 'cover' },
  btnLike: { 
    position: 'absolute', top: '140px', right: '15px', background: 'rgba(0,0,0,0.75)', 
    border: '1px solid #444', borderRadius: '20px', padding: '6px 12px', cursor: 'pointer', 
    display: 'flex', alignItems: 'center', gap: '5px', backdropFilter: 'blur(8px)', zIndex: 100, 
    boxShadow: '0 4px 15px rgba(0,0,0,0.5)' 
  },
  footerTarjeta: { padding: '15px' },
  tituloObra: { margin: '0 0 10px 0', color: '#fff', fontSize: '1.1em', cursor: 'pointer' },
  autorInfo: { display: 'flex', alignItems: 'center', gap: '10px', borderTop: '1px solid #333', paddingTop: '10px' },
  miniAvatar: { width: '26px', height: '26px', borderRadius: '50%' },
  miniAvatarComment: { width: '35px', height: '35px', borderRadius: '50%', objectFit: 'cover', marginRight: '10px' },
  nombreAutor: { fontSize: '0.85em', color: '#aaa' },
  overlay: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
  modal: { width: '80%', maxWidth: '900px', height: '70vh', background: '#111', borderRadius: '20px', overflow: 'hidden', border: '1px solid #333' },
  modalContent: { display: 'flex', height: '100%' },
  modalMedia: { flex: 2, background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  mediaFull: { maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' },
  modalSide: { flex: 1, display: 'flex', flexDirection: 'column', padding: '20px', borderLeft: '1px solid #333', position: 'relative' },
  btnClose: { position: 'absolute', top: '10px', right: '10px', background: 'none', border: 'none', color: '#fff', fontSize: '20px', cursor: 'pointer' },
  modalTitulo: { color: '#f07e11', marginBottom: '20px' },
  listaComentarios: { flex: 1, overflowY: 'auto', marginBottom: '15px' },
  comentarioItem: { display: 'flex', gap: '10px', marginBottom: '15px' },
  textoComentario: { color: '#ddd', fontSize: '0.9em', margin: '2px 0 0 0' },
  btnEliminar: { background: 'none', border: 'none', cursor: 'pointer', padding: '0 5px', opacity: 0.7 },
  formComentario: { display: 'flex', gap: '10px' },
  inputComentario: { flex: 1, background: '#222', border: '1px solid #444', borderRadius: '10px', padding: '10px', color: '#fff' },
  btnEnviar: { background: '#f07e11', border: 'none', borderRadius: '10px', padding: '0 15px', cursor: 'pointer' }
};

export default Galeria;