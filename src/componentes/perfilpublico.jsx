import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { moderador } from './moderacion';

const PerfilPublico = () => {
  const { idUsuario } = useParams();
  const navigate = useNavigate();
  
  const [perfil, setPerfil] = useState(null);
  const [obras, setObras] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [miId, setMiId] = useState(null);

  const [proyectoSeleccionado, setProyectoSeleccionado] = useState(null);
  const [comentarios, setComentarios] = useState([]);
  const [nuevoComentario, setNuevoComentario] = useState('');
  const [enviandoComentario, setEnviandoComentario] = useState(false);
  const [respondiendoA, setRespondiendoA] = useState(null);
  const [textoRespuesta, setTextoRespuesta] = useState('');

  const [comentarioEditandoId, setComentarioEditandoId] = useState(null);

  useEffect(() => {
    const cargarTodo = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setMiId(user?.id);

      const { data: dataPerfil } = await supabase
        .from('perfiles').select('*').eq('id', idUsuario).single();

      if (dataPerfil) {
        setPerfil(dataPerfil);
        document.body.style.backgroundColor = dataPerfil.color_fondo_web || '#0f0f0f';
      }

      const { data: dataObras } = await supabase
        .from('proyectos')
        .select(`*, likes (usuario_id), comentarios (count)`)
        .eq('usuario_id', idUsuario)
        .order('creado_el', { ascending: false });

      if (dataObras) {
        const procesadas = dataObras.map(o => ({
          ...o,
          totalLikes: Number(o.likes?.length) || 0,
          miLike: user ? o.likes?.some(l => l.usuario_id === user.id) : false
        }));
        setObras(procesadas);
      }
      setCargando(false);
    };

    cargarTodo();
    return () => { document.body.style.backgroundColor = null; };
  }, [idUsuario]);

  const abrirProyecto = (proyecto) => {
    setProyectoSeleccionado(proyecto);
    fetchComentarios(proyecto.id);
  };

  const fetchComentarios = async (proyectoId) => {
    const { data } = await supabase
      .from('comentarios')
      .select(`id, contenido, creado_el, usuario_id, parent_id, perfiles ( nombre_completo, avatar_url )`)
      .eq('proyecto_id', proyectoId)
      .order('creado_el', { ascending: true });
    setComentarios(data || []);
  };

  const enviarComentario = async (e) => {
    e.preventDefault();
    if (!nuevoComentario.trim() || !miId) return;

    if (nuevoComentario.trim().length > 100) {
      alert('⚠️ El comentario es demasiado largo (máximo 100 caracteres).');
      return;
    }

    const moderacion = await moderador.validarTexto(nuevoComentario.trim());
    if (!moderacion.seguro) {
      alert('❌ Comentario bloqueado: ' + (moderacion.razon || 'Contenido inapropiado detectado.'));
      console.log('Moderación Perfil Público:', moderacion.detalle);
      return;
    }

    setEnviandoComentario(true);
    const { error } = await supabase.from('comentarios').insert({
      proyecto_id: proyectoSeleccionado.id,
      usuario_id: miId,
      contenido: nuevoComentario.trim()
    });
    if (!error) {
      setNuevoComentario('');
      fetchComentarios(proyectoSeleccionado.id);
    }
    setEnviandoComentario(false);
  };

  const enviarRespuesta = async (padreId) => {
    if (!proyectoSeleccionado?.id) {
      alert('Error: proyecto no seleccionado.');
      return;
    }

    if (!textoRespuesta.trim()) {
      alert('Escribe tu respuesta antes de enviar.');
      return;
    }

    if (textoRespuesta.trim().length > 100) {
      alert('⚠️ El comentario es demasiado largo (máximo 100 caracteres).');
      return;
    }

    const moderacionRespuesta = await moderador.validarTexto(textoRespuesta.trim());
    if (!moderacionRespuesta.seguro) {
      alert('❌ Respuesta bloqueada: contenido inapropiado detectado.');
      return;
    }

    const { data, error } = await supabase
      .from('comentarios')
      .insert([{
        proyecto_id: proyectoSeleccionado.id,
        usuario_id: miId,
        contenido: textoRespuesta.trim(),
        parent_id: padreId
      }])
      .select('*, perfiles(*)');

    if (error) {
      console.error('Error de Supabase:', error.message);
      alert('Error al responder: ' + error.message);
      return;
    }

    await fetchComentarios(proyectoSeleccionado.id);

    setTextoRespuesta('');
    setRespondiendoA(null);
  };

  const borrarComentario = async (comentarioId) => {
    const confirmar = window.confirm("¿Estás seguro de que quieres eliminar este comentario?");
    if (!confirmar) return;

    try {
      const { error } = await supabase
        .from('comentarios')
        .delete()
        .eq('id', comentarioId);

      if (error) throw error;

      // Actualizamos el estado local para que el comentario desaparezca visualmente
      setComentarios(prev => prev.filter(c => c.id !== comentarioId));

    } catch (err) {
      alert("❌ Error al borrar: " + err.message);
    }
  };

  const actualizarComentario = async (comentarioId, contenido) => {
    if (!contenido.trim()) {
      alert('El contenido no puede estar vacío.');
      return;
    }
    if (contenido.trim().length > 100) {
      alert('⚠️ El comentario es demasiado largo (máximo 100 caracteres).');
      return;
    }

    const { error } = await supabase
      .from('comentarios')
      .update({ contenido: contenido.trim() })
      .eq('id', comentarioId);

    if (error) {
      alert('Error al actualizar comentario: ' + error.message);
      return;
    }

    setComentarios(prev => prev.map(c => c.id === comentarioId ? { ...c, contenido: contenido.trim() } : c));
    setComentarioEditandoId(null);
  };

  const manejarLike = async (e, proyectoId, yaTieneLike) => {
    e.stopPropagation();
    if (!miId) return;
    setObras(prev => prev.map(p => p.id === proyectoId ? 
      { ...p, miLike: !yaTieneLike, totalLikes: yaTieneLike ? Number(p.totalLikes) - 1 : Number(p.totalLikes) + 1 } : p
    ));
    if (yaTieneLike) await supabase.from('likes').delete().match({ usuario_id: miId, proyecto_id: proyectoId });
    else await supabase.from('likes').insert({ usuario_id: miId, proyecto_id: proyectoId });
  };

  const ComentarioIndividual = ({ comentario, todosLosComentarios, alResponder, alBorrar, respondiendoA, enviarRespuesta, textoRespuesta, setTextoRespuesta, miId, comentarioEditandoId, setComentarioEditandoId, actualizarComentario }) => {
    const [textoLocal, setTextoLocal] = useState(comentario.contenido || '');

    const hijos = todosLosComentarios.filter(h => String(h.parent_id) === String(comentario.id));
    const esPropio = String(comentario.usuario_id) === String(miId);
    const estaEditando = String(comentarioEditandoId) === String(comentario.id);

    useEffect(() => {
      if (estaEditando) {
        setTextoLocal(comentario.contenido || '');
      }
    }, [estaEditando, comentario.contenido]);

    return (
      <div style={{ 
        marginBottom: '10px', 
        marginLeft: comentario.parent_id ? '30px' : '0px', // Sangría solo si es hijo
        borderLeft: comentario.parent_id ? '1px solid #444' : 'none',
        paddingLeft: comentario.parent_id ? '15px' : '0px'
      }}>
        <div style={estilos.comentarioItem}>
          <img src={comentario.perfiles?.avatar_url || "..."} style={estilos.miniAvatarComment} alt="" />
          <div style={{ flex: 1 }}>
            <strong style={{ fontSize: '0.8em', color: '#f07e11' }}>{comentario.perfiles?.nombre_completo}</strong>
            {estaEditando ? (
              <div style={{ display: 'flex', gap: '8px', marginTop: '6px', alignItems: 'center' }}>
                <input
                  value={textoLocal}
                  onChange={e => setTextoLocal(e.target.value)}
                  style={{ flex: 1, borderRadius: '6px', border: '1px solid #555', background: '#111', color: '#fff', padding: '6px' }}
                />
                <button onClick={() => actualizarComentario(comentario.id, textoLocal)} style={{ ...estilos.btnResponder, background:'#27ae60', color:'#fff' }}>💾</button>
                <button onClick={() => { setComentarioEditandoId(null); setTextoLocal(comentario.contenido || ''); }} style={{ ...estilos.btnBorrar, color:'#fff' }}>✕</button>
              </div>
            ) : (
              <>
                <p style={estilos.textoComentario}>{comentario.contenido}</p>
                <div style={{ display:'flex', gap:'8px' }}>
                  <button onClick={() => alResponder(comentario.id)} style={estilos.btnResponder}>Responder</button>
                  {esPropio && <button onClick={() => { setComentarioEditandoId(comentario.id); setTextoLocal(comentario.contenido || ''); }} style={estilos.btnResponder}>✏️</button>}
                </div>
              </>
            )}
          </div>
          {miId === comentario.usuario_id && <button onClick={() => alBorrar(comentario.id)} style={estilos.btnBorrar}>🗑️</button>}
        </div>

        {/* INPUT DE RESPUESTA SI ESTÁ ACTIVO */}
        {respondiendoA === comentario.id && (
          <div style={{ marginTop: '10px', display: 'flex', gap: '5px', marginLeft: '20px' }}>
            <input 
              type="text" 
              placeholder="Escribe tu respuesta..." 
              style={estilos.inputComentario}
              value={textoRespuesta}
              onChange={(e) => setTextoRespuesta(e.target.value)}
              autoFocus
            />
            <button 
              onClick={() => enviarRespuesta(comentario.id)} 
              style={estilos.btnEnviarComment}
            >
              ➤
            </button>
          </div>
        )}

        {/* LA MAGIA: El componente se llama a sí mismo para renderizar a sus propios hijos */}
        {hijos.map(hijo => (
          <ComentarioIndividual 
            key={hijo.id}
            comentario={hijo}
            todosLosComentarios={todosLosComentarios}
            alResponder={alResponder}
            alBorrar={alBorrar}
            respondiendoA={respondiendoA}
            enviarRespuesta={enviarRespuesta}
            textoRespuesta={textoRespuesta}
            setTextoRespuesta={setTextoRespuesta}
            miId={miId}
            comentarioEditandoId={comentarioEditandoId}
            setComentarioEditandoId={setComentarioEditandoId}
            actualizarComentario={actualizarComentario}
          />
        ))}
      </div>
    );
  };

  if (cargando) return <div style={{color:'white', textAlign:'center', padding:'100px'}}>Cargando...</div>;

  return (
    <section style={estilos.container}>
      <div style={estilos.nav}>
        <button onClick={() => navigate('/galeria')} style={estilos.btnVolver}>⬅ Volver a Explorer</button>
        <button onClick={() => navigate('/dashboard')} style={estilos.btnVolver}>⬅ Volver a mi perfil</button>
      </div>

      <div style={{...estilos.header, background: perfil?.imagen_fondo_url ? `url(${perfil.imagen_fondo_url}) center/cover` : perfil?.color_principal || '#222'}}>
        <img style={estilos.avatar} src={perfil?.avatar_url || "https://via.placeholder.com/120"} alt="Avatar" />
        <h1 style={{ ...estilos.nombre, color: perfil?.color_letra_nombre || '#ffffff' }}>{perfil?.nombre_completo}</h1>
        <p style={{ ...estilos.bio, color: perfil?.color_letra_bio || '#ffffff' }}>{perfil?.biografia || "Sin biografía disponible"}</p>
      </div>

      <div style={estilos.grid}>
        {obras.map((obra) => (
          <div key={obra.id} style={estilos.tarjeta} onClick={() => abrirProyecto(obra)}>
            <div style={estilos.mediaContainer}>
              {/* SOPORTE PARA VIDEO EN MINIATURA */}
              {obra.tipo_archivo === 'video' ? 
                <video src={obra.archivo_url} style={estilos.media} muted loop onMouseOver={e => e.target.play()} onMouseOut={e => e.target.pause()} /> : 
                <img src={obra.archivo_url} style={estilos.media} alt="" />
              }
              <button onClick={(e) => manejarLike(e, obra.id, obra.miLike)} style={estilos.btnLike} title={obra.miLike ? 'Quitar like' : 'Dar like'}>
                {obra.miLike ? '❤️' : '🤍'} {obra.totalLikes}
              </button>
            </div>
            <div style={estilos.info}>
              <h3 style={estilos.tituloObra}>{obra.titulo}</h3>
              <span style={{color: '#aaa'}}>💬 {obra.comentarios?.[0]?.count || 0}</span>
            </div>
          </div>
        ))}
      </div>

      {/* MODAL CON VIDEO Y DESCRIPCIÓN */}
      {proyectoSeleccionado && (
        <div style={estilos.overlay} onClick={() => setProyectoSeleccionado(null)}>
          <div style={estilos.modal} onClick={e => e.stopPropagation()}>
            <div style={estilos.modalContent}>
              <div style={estilos.modalMedia}>
                {proyectoSeleccionado.tipo_archivo === 'video' ? 
                  <video src={proyectoSeleccionado.archivo_url} controls autoPlay style={estilos.mediaFull} /> : 
                  <img src={proyectoSeleccionado.archivo_url} style={estilos.mediaFull} alt="" />
                }
              </div>
              <div style={estilos.modalSide}>
                <button style={estilos.btnClose} onClick={() => {
                     setProyectoSeleccionado(null);
                     setRespondiendoA(null); // Limpiamos para que no se quede abierto al cambiar de post
}}                   >✕</button>
                <h2 style={estilos.modalTitulo}>{proyectoSeleccionado.titulo}</h2>
                
                {/* AQUÍ SE MUESTRA LA DESCRIPCIÓN (solo si existe) */}
                {proyectoSeleccionado.descripcion && (
                  <p style={estilos.descripcionText}>{proyectoSeleccionado.descripcion}</p>
                )}

                <div style={estilos.listaComentarios}>
                  {/* Renderizamos solo los comentarios RAÍZ (sin padre), el componente se encarga del resto */}
                  {comentarios.filter(c => !c.parent_id).map(c => (
                    <ComentarioIndividual 
                      key={c.id}
                      comentario={c}
                      todosLosComentarios={comentarios}
                      alResponder={setRespondiendoA}
                      alBorrar={borrarComentario}
                      respondiendoA={respondiendoA}
                      enviarRespuesta={enviarRespuesta}
                      textoRespuesta={textoRespuesta}
                      setTextoRespuesta={setTextoRespuesta}
                      miId={miId}
                      comentarioEditandoId={comentarioEditandoId}
                      setComentarioEditandoId={setComentarioEditandoId}
                      actualizarComentario={actualizarComentario}
                    />
                  ))}
                </div>
                <form onSubmit={enviarComentario} style={estilos.formComentario}>
                  <input style={estilos.inputComentario} value={nuevoComentario} onChange={(e) => setNuevoComentario(e.target.value)} placeholder="Añadir comentario..." />
                  <button type="submit" style={estilos.btnEnviar}>➤</button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

const estilos = {
  container: { maxWidth: '1200px', margin: '0 auto', padding: '20px', minHeight: '100vh' },
  nav: { marginBottom: '20px' },
  btnVolver: { background: '#222', color: '#f07e11', border: '1px solid #444', padding: '10px 20px', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold' },
  header: { textAlign: 'center', padding: '50px 20px', borderRadius: '25px', marginBottom: '30px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)', color: 'white' },
  avatar: { width: '120px', height: '120px', borderRadius: '50%', border: '4px solid #f07e11', objectFit: 'cover' },
  nombre: { fontSize: '2.5em', margin: '15px 0 5px', wordBreak: 'break-word', overflowWrap: 'break-word', whiteSpace: 'pre-wrap' },
  bio: { opacity: 0.8, maxWidth: '600px', margin: '0 auto', wordBreak: 'break-word', overflowWrap: 'break-word', whiteSpace: 'pre-wrap', backgroundColor: 'rgba(0,0,0,0.45)', padding: '10px 14px', borderRadius: '14px' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' },
  tarjeta: { background: '#1a1a1a', borderRadius: '18px', overflow: 'hidden', border: '1px solid #333', cursor: 'pointer' },
  mediaContainer: { position: 'relative', height: '190px', background: '#000' },
  media: { width: '100%', height: '100%', objectFit: 'cover' },
  btnLike: { position: 'absolute', bottom: '10px', right: '10px', background: 'rgba(0,0,0,0.7)', border: 'none', borderRadius: '15px', padding: '5px 12px', color: 'white' },
  info: { padding: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  tituloObra: { color: 'white', margin: 0, fontSize: '1.1em' },
  overlay: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.9)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000 },
  modal: { width: '90%', maxWidth: '1000px', height: '80vh', background: '#111', borderRadius: '25px', overflow: 'hidden', border: '1px solid #333' },
  modalContent: { display: 'flex', height: '100%' },
  modalMedia: { flex: 2, background: '#000', display: 'flex', alignItems: 'center' },
  mediaFull: { width: '100%', height: '100%', objectFit: 'contain' },
  modalSide: { flex: 1, padding: '25px', display: 'flex', flexDirection: 'column', borderLeft: '1px solid #333', color: 'white' },
  btnClose: { alignSelf: 'flex-end', background: 'none', border: 'none', color: 'white', fontSize: '24px', cursor: 'pointer' },
  modalTitulo: { color: '#f07e11', margin: '10px 0' },

  descripcionText: { fontSize: '0.95em', color: '#ccc', marginBottom: '20px', lineHeight: '1.4', whiteSpace: 'pre-wrap', overflowWrap: 'break-word', wordBreak: 'break-word', background: 'rgba(0,0,0,0.55)', padding: '14px', borderRadius: '12px' },
  listaComentarios: { flex: 1, overflowY: 'auto', marginBottom: '15px' },
  comentarioItem: { display: 'flex', gap: '10px', marginBottom: '15px', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #333' },
  miniAvatar: { width: '30px', height: '30px', borderRadius: '50%' },
  miniAvatarComment: { width: '30px', height: '30px', borderRadius: '50%' },
  textoComentario: { fontSize: '0.9em', margin: 0, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', wordBreak: 'break-all' },
  btnResponder: { background: 'none', border: 'none', color: '#f07e11', cursor: 'pointer', fontSize: '0.8em', padding: '2px 0' },
  btnBorrar: { background: 'none', border: 'none', color: '#e74c3c', cursor: 'pointer', fontSize: '1em', padding: '5px' },
  formComentario: { display: 'flex', gap: '10px' },
  inputComentario: { flex: 1, background: '#222', border: '1px solid #444', color: 'white', padding: '10px', borderRadius: '10px' },
  btnEnviar: { background: '#f07e11', border: 'none', padding: '0 15px', borderRadius: '10px', cursor: 'pointer' },
  btnEnviarComment: { background: '#f07e11', border: 'none', padding: '0 15px', borderRadius: '10px', cursor: 'pointer' }
};

export default PerfilPublico;