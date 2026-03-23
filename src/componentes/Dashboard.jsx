import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import { validarPerfil, validarProyecto } from './validaciones'; 
import { moderador } from './moderacion';


const STORAGE_KEY_NOTIF_LEIDAS = 'pocketwork_notificaciones_leidas';

const ComentarioIndividual = ({ comentario, todosLosComentarios, alResponder, alBorrar, respondiendoA, enviarRespuesta, textoRespuesta, setTextoRespuesta, currentUserId, comentarioEditandoId, comentarioEditandoTexto, setComentarioEditandoId, setComentarioEditandoTexto, actualizarComentario }) => {
  const navigate = useNavigate();
  const hijos = todosLosComentarios.filter(h => String(h.parent_id) === String(comentario.id));
  const esPropio = String(comentario.usuario_id) === String(currentUserId);
  const estaEditando = String(comentarioEditandoId) === String(comentario.id);

  const irAPerfil = () => {
    if (!esPropio && comentario.usuario_id) {
      navigate(`/perfil/${comentario.usuario_id}`);
    }
  };

  return (
    <div style={{ 
      marginBottom: '10px', 
      marginLeft: comentario.parent_id ? '30px' : '0px', // Sangría solo si es hijo
      borderLeft: comentario.parent_id ? '1px solid #444' : 'none',
      paddingLeft: comentario.parent_id ? '15px' : '0px'
    }}>
      <div style={estilos.comentarioItem}>
        <img
          src={comentario.perfiles?.avatar_url || "..."}
          style={{ ...estilos.miniAvatarComment, cursor: esPropio ? 'default' : 'pointer' }}
          alt=""
          onClick={esPropio ? undefined : irAPerfil}
        />
        <div style={{ flex: 1 }}>
          <strong
            onClick={esPropio ? undefined : irAPerfil}
            style={{ fontSize: '0.8em', color: '#f07e11', cursor: esPropio ? 'default' : 'pointer' }}
          >
            {comentario.perfiles?.nombre_completo}
          </strong>
          {estaEditando ? (
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '6px' }}>
              <input
                value={comentarioEditandoTexto}
                onChange={(e) => setComentarioEditandoTexto(e.target.value)}
                style={{ ...estilos.inputComentario, fontSize: '0.85em', minWidth: '0' }}
              />
              <button
                onClick={() => actualizarComentario(comentario.id, comentarioEditandoTexto)}
                style={estilos.btnResponder}
              >💾</button>
              <button
                onClick={() => { setComentarioEditandoId(null); setComentarioEditandoTexto(''); }}
                style={estilos.btnBorrar}
              >✕</button>
            </div>
          ) : (
            <>
              <p style={estilos.textoComentario}>{comentario.contenido}</p>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => alResponder(comentario.id)} style={estilos.btnResponder}>Responder</button>
                {esPropio && (
                  <button
                    onClick={() => {
                      setComentarioEditandoId(comentario.id);
                      setComentarioEditandoTexto(comentario.contenido);
                    }}
                    style={estilos.btnResponder}
                  >✏️</button>
                )}
              </div>
            </>
          )}
        </div>
        <button onClick={() => alBorrar(comentario.id)} style={estilos.btnBorrar}>🗑️</button>
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
          currentUserId={currentUserId}
          comentarioEditandoId={comentarioEditandoId}
          comentarioEditandoTexto={comentarioEditandoTexto}
          setComentarioEditandoId={setComentarioEditandoId}
          setComentarioEditandoTexto={setComentarioEditandoTexto}
          actualizarComentario={actualizarComentario}
        />
      ))}
    </div>
  );
};

     // no olvides wilis la funcion anterior es para recursividad de comentarios

const Dashboard = ({ alCerrarSesion }) => {
  const [usuario, setUsuario] = useState(null);
  const navigate = useNavigate();
  
  const [perfil, setPerfil] = useState({
    nombre: 'Cargando...',
    bio: 'Artista ✨',
    colorPrincipal: '#4a90e2',
    colorSecundario: '#357abd',
    colorFondoWeb: '#ffffff',
    colorLetraNombre: '#ffffff',
    colorLetraBio: '#ffffff',
    avatarUrl: null,
    imagenFondoUrl: null
  });
  
  const [obras, setObras] = useState([]); 
  const [nuevaObra, setNuevaObra] = useState({ titulo: '', descripcion: '', imagenUrl: '' }); 
  const [cargando, setCargando] = useState(true);

  // ESTADOS PARA COMENTARIOS
  const [proyectoSeleccionado, setProyectoSeleccionado] = useState(null);
  const [comentarios, setComentarios] = useState([]);
  const [nuevoComentario, setNuevoComentario] = useState('');
  const [enviandoComentario, setEnviandoComentario] = useState(false);
  const [respondiendoA, setRespondiendoA] = useState(null); // Guarda el ID del comentario al que respondes
  const [textoRespuesta, setTextoRespuesta] = useState('');

  const [comentarioEditandoId, setComentarioEditandoId] = useState(null);
  const [comentarioEditandoTexto, setComentarioEditandoTexto] = useState('');

  const [notificaciones, setNotificaciones] = useState([]);
  const [contadorNotificaciones, setContadorNotificaciones] = useState(0);
  const [notificacionesLeidasCount, setNotificacionesLeidasCount] = useState(0);

  const [editandoTitulo, setEditandoTitulo] = useState(false);
  const [menuAbierto, setMenuAbierto] = useState(false);

  useEffect(() => {
    const almacenadas = localStorage.getItem(STORAGE_KEY_NOTIF_LEIDAS);
    const parsed = Number(almacenadas);
    if (Number.isFinite(parsed) && parsed >= 0) {
      setNotificacionesLeidasCount(parsed);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_NOTIF_LEIDAS, String(notificacionesLeidasCount));
  }, [notificacionesLeidasCount]);

  const actualizarContador = (totalNotificaciones) => {
    const leidas = Number(localStorage.getItem(STORAGE_KEY_NOTIF_LEIDAS)) || 0;
    const nuevos = Math.max(0, totalNotificaciones - leidas);
    setContadorNotificaciones(nuevos);
  };

  useEffect(() => {
    const leidas = Number(localStorage.getItem(STORAGE_KEY_NOTIF_LEIDAS)) || 0;
    const nuevos = Math.max(0, notificaciones.length - leidas);
    setContadorNotificaciones(nuevos);
  }, [notificaciones, notificacionesLeidasCount]);

  const [tituloEditando, setTituloEditando] = useState('');

  useEffect(() => {
    document.body.style.backgroundColor = perfil.colorFondoWeb;
    return () => { document.body.style.backgroundColor = null; };
  }, [perfil.colorFondoWeb]);

  useEffect(() => {
    const inicializar = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUsuario(user);
        await cargarPerfil(user.id);
      }
      setCargando(false);
    };
    inicializar();
  }, []);

  useEffect(() => {
    if (usuario) {
      cargarObrasConStats();
    }
  }, [usuario]);

  const cargarObrasConStats = async () => {
    const { data, error } = await supabase
      .from('proyectos')
      .select(`
        *,
        likes (usuario_id),
        comentarios (count)
      `)
      .eq('usuario_id', usuario.id)
      .order('creado_el', { ascending: false });

    if (error) console.error("Error cargando estadísticas:", error.message);
    if (data) {
      const procesadas = data.map(o => ({
        ...o,
        totalLikes: Number(o.likes?.length) || 0,
        miLike: o.likes?.some(l => l.usuario_id === usuario.id) || false
      }));
      setObras(procesadas);
    }
  };

  const formatearNotificacion = (comentario) => {
    const obra = obras.find(o => o.id === comentario.proyecto_id);
    const nombreObra = obra ? obra.titulo : 'tu publicación';
    const nombreAutor = comentario.perfiles?.nombre_completo || 'Alguien';
    return {
      id: comentario.id,
      texto: `${nombreAutor} comentó en ${nombreObra}: "${comentario.contenido}"`,
      fecha: comentario.creado_el,
      proyecto_id: comentario.proyecto_id
    };
  };

      const cargarNotificaciones = async () => {
  if (!usuario || obras.length === 0) {
    return [];
  }

  console.log('[Dashboard] cargarNotificaciones: usuario=', usuario?.id, 'obras=', obras.length);

  const proyectosIds = obras.map(o => o.id);
  const { data, error } = await supabase
    .from('comentarios')
    .select(`id, proyecto_id, usuario_id, creado_el, contenido, perfiles(nombre_completo)`)
    .in('proyecto_id', proyectosIds)
    .neq('usuario_id', usuario.id);

  if (!error && data) {
    const formateadas = data.map(formatearNotificacion);
    setNotificaciones(formateadas);

    actualizarContador(formateadas.length);

    console.log('[Dashboard] cargarNotificaciones: totalDB=', formateadas.length);

    return formateadas;
  }

  return [];
};
    // EFECTO 1: Solo carga al iniciar o cuando cambian las obras
useEffect(() => {
  if (usuario && obras.length > 0) {
    cargarNotificaciones();
  }
}, [obras, usuario]);

// EFECTO 2: El intervalo (Asegúrate de que use la versión fresca de la función)
useEffect(() => {
  const intervalo = setInterval(() => {
    cargarNotificaciones();
  }, 20000);
  return () => clearInterval(intervalo);
}, [obras, usuario]);


  const manejarIrNotificaciones = async () => {
  // Ideal: marcamos los comentarios como leídos y navegamos.
  const listaActual = await cargarNotificaciones();
  const total = Array.isArray(listaActual) ? listaActual.length : notificaciones.length;

  console.log('[Dashboard] manejarIrNotificaciones', { total, notificacionesLeidasCount });

  setContadorNotificaciones(0);
  setNotificacionesLeidasCount(total);
  localStorage.setItem(STORAGE_KEY_NOTIF_LEIDAS, String(total));
  setNotificaciones(listaActual);

  navigate('/notificaciones', { state: { notificaciones: listaActual } });
};


  const manejarLike = async (e, proyectoId, yaTieneLike) => {
    e.stopPropagation();
    setObras(prev => prev.map(p => p.id === proyectoId ? 
      { ...p, miLike: !yaTieneLike, totalLikes: yaTieneLike ? Number(p.totalLikes) - 1 : Number(p.totalLikes) + 1 } : p
    ));
    if (yaTieneLike) await supabase.from('likes').delete().match({ usuario_id: usuario.id, proyecto_id: proyectoId });
    else await supabase.from('likes').insert({ usuario_id: usuario.id, proyecto_id: proyectoId });
  };

  const abrirProyecto = (proyecto) => {
    setProyectoSeleccionado(proyecto);
    setTituloEditando(proyecto.titulo || '');
    setEditandoTitulo(false);
    setComentarioEditandoId(null);
    setComentarioEditandoTexto('');
    fetchComentarios(proyecto.id);
  };



  
  // ...existing code...

 const fetchComentarios = async (proyectoId) => {
  const { data, error } = await supabase
    .from('comentarios')
    .select(`
      id, contenido, creado_el, usuario_id, parent_id,
      perfiles ( id, nombre_completo, avatar_url )
    `)
    .eq('proyecto_id', proyectoId)
    .order('creado_el', { ascending: true });

    if (error) console.error("Error:", error.message);
    else setComentarios(data || []);
    };

  const enviarComentario = async (e) => {
    e.preventDefault();
    if (!nuevoComentario.trim() || !usuario || !proyectoSeleccionado?.id) return;

    if (nuevoComentario.trim().length > 100) {
      alert('⚠️ El comentario es demasiado largo (máximo 100 caracteres).');
      return;
    }

    // Moderación de texto
    const resultadoModeracion = await moderador.validarTexto(nuevoComentario.trim());
    if (!resultadoModeracion.seguro) {
      alert('❌ Comentario bloqueado: ' + (resultadoModeracion.razon || 'Contenido inapropiado.'));
      console.log('Moderación detalle:', resultadoModeracion.detalle);
      return;
    }

    setEnviandoComentario(true);
    const { error } = await supabase
      .from('comentarios')
      .insert({
        proyecto_id: proyectoSeleccionado.id,
        usuario_id: usuario.id,
        contenido: nuevoComentario.trim()
      });

    if (!error) {
      setNuevoComentario('');
      await fetchComentarios(proyectoSeleccionado.id);
      cargarObrasConStats(); 
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

    // Moderación de texto
    const resultadoModeracion = await moderador.validarTexto(textoRespuesta.trim());
    if (!resultadoModeracion.seguro) {
      alert('❌ Respuesta bloqueada: Contiene contenido inapropiado.');
      return;
    }

    const { data, error } = await supabase
      .from('comentarios')
      .insert([{
        proyecto_id: proyectoSeleccionado.id,
        usuario_id: usuario.id,
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

  const actualizarComentario = async (comentarioId, contenido) => {
    if (!contenido.trim()) {
      alert('El contenido no puede estar vacío.');
      return;
    }
    if (contenido.trim().length > 100) {
      alert('⚠️ El comentario es demasiado largo (máximo 100 caracteres).');
      return;
    }

   
    const { data, error } = await supabase
      .from('comentarios')
      .update({ contenido: contenido.trim() })
      .eq('id', comentarioId)
      .eq('usuario_id', usuario?.id)
      .select('*');

    if (error) {
      alert('Error al actualizar comentario: ' + error.message);
      console.error(error);
      return;
    }

    console.log('comentario actualizado response', data);

    const { data: verifico, error: errorVerifico } = await supabase
      .from('comentarios')
      .select('contenido')
      .eq('id', comentarioId)
      .single();

    if (errorVerifico || (!verifico || verifico.contenido !== contenido.trim())) {
      alert('No se pudo validar el comentario en la base de datos; inténtalo de nuevo.');
      console.error('Verificación de comentario fallida', errorVerifico, verifico);
      return;
    }

    setComentarios(prev => prev.map(c => c.id === comentarioId ? { ...c, contenido: contenido.trim() } : c));
    setComentarioEditandoId(null);
    setComentarioEditandoTexto('');
    if (proyectoSeleccionado?.id) await fetchComentarios(proyectoSeleccionado.id);
    await cargarObrasConStats();
  };

  const actualizarTituloProyecto = async () => {
    if (!proyectoSeleccionado) return;
    if (!tituloEditando.trim()) {
      alert('El título no puede estar vacío.');
      return;
    }
    if (tituloEditando.trim().length > 20) {
      alert('El título es demasiado largo (máximo 20 caracteres).');
      return;
    }

    const nuevoTitulo = tituloEditando.trim();
    const { data, error } = await supabase
      .from('proyectos')
      .update({ titulo: nuevoTitulo })
      .eq('id', proyectoSeleccionado.id)
      .select('*');

    if (error) {
      alert('Error al actualizar el título: ' + error.message);
      console.error(error);
      return;
    }

    console.log('proyecto actualizado response', data);

    // Verificamos que realmente se guardó en DB
    const { data: verifico, error: errorVerifico } = await supabase
      .from('proyectos')
      .select('titulo')
      .eq('id', proyectoSeleccionado.id)
      .single();

    if (errorVerifico || (!verifico || verifico.titulo !== nuevoTitulo)) {
      alert('No se pudo validar el título en la base de datos; recarga para ver si se aplicó.');
      console.error('Verificación de título fallida', errorVerifico, verifico);
      return;
    }

    setProyectoSeleccionado(prev => ({ ...prev, titulo: nuevoTitulo }));
    setObras(prev => prev.map(o => o.id === proyectoSeleccionado.id ? { ...o, titulo: nuevoTitulo } : o));
    setEditandoTitulo(false);
    await cargarObrasConStats();
    alert('✅ Título actualizado.');
  };

  const cargarPerfil = async (userId) => {
    const { data, error } = await supabase
      .from('perfiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) return;

    if (data) {
      setPerfil({
        nombre: data.nombre_completo || '',
        bio: data.biografia || '',
        colorPrincipal: data.color_principal || '#4a90e2',
        colorSecundario: data.color_secundario || '#357abd',
        colorFondoWeb: data.color_fondo_web || '#ffffff',
        colorLetraNombre: data.color_letra_nombre || '#ffffff',
        colorLetraBio: data.color_letra_bio || '#ffffff',
        avatarUrl: data.avatar_url,
        imagenFondoUrl: data.imagen_fondo_url
      });
    }
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
    
    // Opcional: Recargar estadísticas para actualizar el contador de comentarios en la tarjeta
    cargarObrasConStats();

  } catch (err) {
    alert("❌ Error al borrar: " + err.message);
  }
};


  // BOTÓN GUARDAR: Ahora solo para Textos y Colores

const guardarCambiosPerfil = async () => {
  // 1. Ejecutamos la validación (Nombre máx 25, Bio máx 150)
  const resultado = validarPerfil(perfil);

  if (!resultado.valido) {
    const primerError = Object.values(resultado.errores)[0];
    alert("⚠️ " + primerError);
    return; 
  }

  // 1.5. Validación adicional con moderador para evitar nombres/descripciones explícitas
  const moderacionNombre = await moderador.validarTexto(perfil.nombre || '');
  if (!moderacionNombre.seguro) {
    alert('❌ Nombre bloqueado: contenido inapropiado detectado.');
    return;
  }

  const moderacionBio = await moderador.validarTexto(perfil.bio || '');
  if (!moderacionBio.seguro) {
    alert('❌ Biografía bloqueada: contenido inapropiado detectado.');
    return;
  }

  if (!usuario) return alert("Espera a que cargue tu sesión...");
  setCargando(true);

    const datosParaDB = {
   id: usuario.id,
   nombre_completo: perfil.nombre,
   biografia: perfil.bio,
   color_principal: perfil.colorPrincipal,
   color_secundario: perfil.colorSecundario,
   color_fondo_web: perfil.colorFondoWeb,
   // Asegúrate de que estas propiedades existan en tu estado 'perfil'
   color_letra_nombre: perfil.colorLetraNombre, 
   color_letra_bio: perfil.colorLetraBio
};

  const { error: errorPerfil } = await supabase
    .from('perfiles')
    .upsert(datosParaDB, { onConflict: 'id' });

  if (errorPerfil) {
    console.error('Error guardando perfil:', errorPerfil);
    if (errorPerfil.code === '23505') {
      alert('❌ Este nombre de usuario ya está en uso. Por favor, elige otro.');
    } else {
      alert('❌ Error guardando perfil: ' + errorPerfil.message);
    }
  } else {
    alert('✅ ¡Información actualizada!');
  }

  setCargando(false);
};

const prepararArchivoProyecto = async (event) => {
    const archivo = event.target.files[0];
    if (!archivo) return;


   const tiposPermitidos = ['image', 'video', 'audio'];
   // Verificamos si el tipo de archivo (MIME type) empieza con alguno de los permitidos
   const esValido = tiposPermitidos.some(tipo => archivo.type.startsWith(tipo));

  if (!esValido) {
    alert("❌ Archivo no permitido. Solo puedes subir Imágenes, Videos o Audios.");
    event.target.value = ""; // Limpia el input para que no quede el archivo malo ahí
    return; // Detiene todo
  }
    // VALIDACIÓN DE TAMAÑO: 50MB (50 * 1024 * 1024 bytes)
    const limiteMB = 50;
    const limiteBytes = limiteMB * 1024 * 1024;

    if (archivo.size > limiteBytes) {
      alert(`⚠️ El archivo es demasiado grande. El límite son ${limiteMB}MB.`);
      event.target.value = ""; // Limpia el input para que no intente subirlo
      return;
    }

    setCargando(true);
    const nombreArchivo = `${Date.now()}-${archivo.name}`;

    try {
      // Subida al Bucket 'Proyectos'
      const { error: uploadError } = await supabase.storage
        .from('Proyectos')
        .upload(nombreArchivo, archivo);

      if (uploadError) throw uploadError;

      // Obtener la URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('Proyectos')
        .getPublicUrl(nombreArchivo);

      // Moderación de media (solo para imágenes y videos)
      if (archivo.type.startsWith('image') || archivo.type.startsWith('video')) {
        const resultadoModeracion = await moderador.validarMedia(publicUrl, archivo.type);
        if (!resultadoModeracion.seguro) {
          alert('❌ Archivo bloqueado: Contiene contenido inapropiado.');
          // Eliminar el archivo subido
          await supabase.storage.from('Proyectos').remove([nombreArchivo]);
          setCargando(false);
          event.target.value = "";
          return;
        }
      }

      // Guardamos la URL en el estado temporal para que el botón de publicar la use
      setNuevaObra(prev => ({ ...prev, imagenUrl: publicUrl }));
      
      alert("✅ Archivo cargado correctamente. Ahora puedes ponerle un título y publicar.");

    } catch (err) {
      alert("❌ Error al subir el archivo: " + err.message);
      console.error(err);
    } finally {
      setCargando(false);
    }
  };

const publicarProyecto = async () => {
    // 1. Usamos la validación que exportamos (Título máx 20, etc.)
    const check = validarProyecto(nuevaObra);
    
    if (!check.valido) {
      alert("⚠️ " + Object.values(check.errores)[0]);
      return; // Detiene la ejecución si hay error
    }

    // 1.5. Validación de texto usando moderador para evitar contenido explicito
    const moderacionTitulo = await moderador.validarTexto(nuevaObra.titulo || '');
    if (!moderacionTitulo.seguro) {
      alert('❌ Título bloqueado: contenido inapropiado detectado.');
      return;
    }

    const moderacionDescripcion = await moderador.validarTexto(nuevaObra.descripcion || '');
    if (!moderacionDescripcion.seguro) {
      alert('❌ Descripción bloqueada: contenido inapropiado detectado.');
      return;
    }

    // 1.6. Validación adicional de media para doble verificación
    const resultadoModeracionMedia = await moderador.validarMedia(nuevaObra.imagenUrl, '');
    if (!resultadoModeracionMedia.seguro) {
      alert('❌ Proyecto bloqueado: el archivo contiene contenido inapropiado.');
      return;
    }

    setCargando(true);

    // 2. Lógica para detectar el tipo de archivo automáticamente
    let tipoDetectado = 'imagen';
    const urlLower = nuevaObra.imagenUrl.toLowerCase();

    if (urlLower.match(/\.(mp4|webm|ogg|mov)$/i)) {
      tipoDetectado = 'video';
    } else if (urlLower.match(/\.(mp3|wav|flac|aac)$/i)) {
      tipoDetectado = 'audio';
    }

    try {
      // 3. Inserción en Supabase
      const { error } = await supabase.from('proyectos').insert([
        { 
          usuario_id: usuario.id, 
          titulo: nuevaObra.titulo, 
          archivo_url: nuevaObra.imagenUrl, 
          tipo_archivo: tipoDetectado 
        }
      ]);

      if (error) throw error;

      alert(`🚀 ¡Proyecto (${tipoDetectado}) publicado con éxito!`);
      
      // 4. Limpiar el formulario y recargar la lista
      setNuevaObra({ titulo: '', descripcion: '', imagenUrl: '' });
      cargarObrasConStats(); 
      
    } catch (err) {
      alert("❌ Error al publicar: " + err.message);
    } finally {
      setCargando(false);
    }
  };

  const borrarProyecto = async (id) => {
    if (!window.confirm("¿Eliminar proyecto?")) return;
    const { error } = await supabase.from('proyectos').delete().eq('id', id);
    if (error) alert("Error: " + error.message);
    else setObras(obras.filter(o => o.id !== id));
  };

  const subirImagen = async (event, nombreBucket, columnaDB, campoEstado) => {
    const archivo = event.target.files[0];
    if (!archivo) return;
    // Validar que sea imagen
    if (!archivo.type.startsWith('image/')) {
      alert('Solo se permiten archivos de imagen (jpg, png, gif, etc).');
      event.target.value = "";
      return;
    }
    setCargando(true);
    const nombreArchivo = `${Date.now()}-${archivo.name}`;
    const { error: uploadError } = await supabase.storage.from(nombreBucket).upload(nombreArchivo, archivo);

    if (uploadError) {
      alert("Error: " + uploadError.message);
      setCargando(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage.from(nombreBucket).getPublicUrl(nombreArchivo);

    // Moderación de imagen (igual que en proyectos)
    try {
      const resultadoModeracion = await moderador.validarMedia(publicUrl);
      if (!resultadoModeracion.seguro) {
        alert('❌ Imagen bloqueada: contiene contenido inapropiado.');
        // Eliminar la imagen subida
        await supabase.storage.from(nombreBucket).remove([nombreArchivo]);
        setCargando(false);
        event.target.value = "";
        return;
      }
    } catch (err) {
      alert('Error al moderar la imagen. Intenta de nuevo.');
      // Eliminar la imagen subida por seguridad
      await supabase.storage.from(nombreBucket).remove([nombreArchivo]);
      setCargando(false);
      event.target.value = "";
      return;
    }

    const { error: dbError } = await supabase
        .from('perfiles')
        .update({ [columnaDB]: publicUrl })
        .eq('id', usuario.id);

    if (dbError) alert("Error: " + dbError.message);
    else setPerfil(prev => ({ ...prev, [campoEstado]: publicUrl }));
    setCargando(false);
  };



  const manejarCerrarSesion = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const obtenerFondoHeader = () => {
    if (perfil.imagenFondoUrl) return `url(${perfil.imagenFondoUrl}) center/cover no-repeat`;
    return perfil.colorPrincipal;
  };

  if (cargando && !usuario) return <div style={{color:'white', padding:'50px', textAlign:'center'}}>Cargando...</div>;

  return (
    <section style={estilos.dashboard}>
      <div style={estilos.navBar}>
        <div style={{ position: 'relative' }}>
          <button 
            style={estilos.btnHamburguesa} 
            onClick={() => setMenuAbierto(!menuAbierto)}
          >
            ☰ Menú
          </button>
          
          {menuAbierto && (
            <div style={estilos.menuDesplegable}>
              <button 
                onClick={() => { setMenuAbierto(false); navigate('/galeria'); }} 
                style={estilos.menuItem}
              >
                🌐 Galería
              </button>
              <button 
                onClick={() => { setMenuAbierto(false); navigate('/notificaciones'); }} 
                style={estilos.menuItem}
              >
                📋 Ver actividad
              </button>
              <div style={{ borderTop: '1px solid #eee', margin: '5px 0' }}></div>
              <button 
                style={{...estilos.menuItem, color: '#e74c3c', fontWeight: 'bold'}} 
                onClick={() => { setMenuAbierto(false); manejarCerrarSesion(); }}
              >
                🚪 Cerrar Sesión
              </button>
            </div>
          )}
        </div>
      </div>
      
      <div style={{...estilos.perfilHeader, background: obtenerFondoHeader()}}>
        <img style={estilos.fotoPerfil} src={perfil.avatarUrl || "https://via.placeholder.com/120?text=👤"} alt="Perfil" />
        <h1 style={{ ...estilos.nombreUsuario, color: perfil.colorLetraNombre }}>{perfil.nombre}</h1>
        <p style={{ ...estilos.bioUsuario, color: perfil.colorLetraBio }}>{perfil.bio}</p>
        
        <div style={estilos.configPerfil}>
          <h4 style={{color:'#333', marginBottom:'15px'}}>⚙️ Personalizar mi espacio</h4>
          <div style={estilos.configRow}>
            <div style={estilos.configGrupo}>
              <label style={estilos.label}>Foto Perfil (Auto):</label>
              <input type="file" accept="image/*" onChange={(e) => subirImagen(e, 'Avatares', 'avatar_url', 'avatarUrl')} style={estilos.inputFileSmall} />
            </div>
            <input 
  type="text" 
  maxLength={25} // <--- NO DEJA ESCRIBIR MÁS DE 25
  style={estilos.inputText} 
  value={perfil.nombre} 
  onChange={(e) => setPerfil({...perfil, nombre: e.target.value})} 
/>
<textarea 
  maxLength={150} // <--- NO DEJA ESCRIBIR MÁS DE 150
  style={{...estilos.inputText, height: '60px', resize: 'none'}} 
  value={perfil.bio} 
  onChange={(e) => setPerfil({...perfil, bio: e.target.value})} 
/>
          </div>

          <div style={estilos.configRow}>
            <div style={estilos.configGrupoColor}><label style={estilos.label}>Principal:</label><input type="color" value={perfil.colorPrincipal} style={estilos.inputColor} onChange={(e) => setPerfil({...perfil, colorPrincipal: e.target.value})} /></div>
            <div style={estilos.configGrupoColor}><label style={estilos.label}>Fondo Web:</label><input type="color" value={perfil.colorFondoWeb} style={estilos.inputColor} onChange={(e) => setPerfil({...perfil, colorFondoWeb: e.target.value})} /></div>
            <div style={estilos.configGrupoColor}><label style={estilos.label}>Cuadro:</label><input type="color" value={perfil.colorSecundario} style={estilos.inputColor} onChange={(e) => setPerfil({...perfil, colorSecundario: e.target.value})} /></div>
            <div style={estilos.configGrupoColor}><label style={estilos.label}>Color texto nombre:</label><input type="color" value={perfil.colorLetraNombre} style={estilos.inputColor} onChange={(e) => setPerfil({...perfil, colorLetraNombre: e.target.value})} /></div>
            <div style={estilos.configGrupoColor}><label style={estilos.label}>Color texto bio:</label><input type="color" value={perfil.colorLetraBio} style={estilos.inputColor} onChange={(e) => setPerfil({...perfil, colorLetraBio: e.target.value})} /></div>
            <div style={estilos.configGrupo}><label style={estilos.label}>Fondo (Auto):</label><input type="file" onChange={(e) => subirImagen(e, 'Fondos', 'imagen_fondo_url', 'imagenFondoUrl')} style={estilos.inputFileSmall} /></div>
            
            <div style={estilos.configGrupo}>
                <label style={estilos.label}>Plantilla (Auto):</label>
                <input 
                    type="number" 
                    min="1" 
                    max="50" 
                    style={estilos.inputText} 
                    placeholder="Ej: 1"
                    onChange={async (e) => {
                        const num = parseInt(e.target.value);
                        if (num >= 1 && num <= 50) {
                          const url = `/imagenes/plantillas/textura${num}.png`;
                          setPerfil({...perfil, imagenFondoUrl: url });
                          // Guardado automático de plantilla
                          await supabase.from('perfiles').update({ imagen_fondo_url: url }).eq('id', usuario.id);
                        } else if (num) {
                          alert('Plantilla no disponible. Solo hay plantillas del 1 al 50.');
                          e.target.value = ''; // Limpiar el campo
                        }
                    }} 
                />
            </div>

            <button style={estilos.btnGuardar} onClick={guardarCambiosPerfil}>💾 Guardar Textos/Colores</button>
          </div>
        </div>
      </div>
            
       <div style={{...estilos.subirObra, background: perfil.colorSecundario}}>
  <h2>🎨 Publicar Nuevo Proyecto</h2>
  <div style={{display: 'flex', gap: '15px', flexWrap: 'wrap'}}>
    <input 
      type="text" 
      maxLength={20} 
      placeholder="Título (máx 20)" 
      style={estilos.inputText} 
      value={nuevaObra.titulo} 
      onChange={(e) => setNuevaObra({...nuevaObra, titulo: e.target.value})} 
    />
    
    {/* CONECTAMOS LA FUNCIÓN AQUÍ */}
    <input 
      type="file" 
      accept="image/*,video/*,audio/*" 
      onChange={prepararArchivoProyecto} 
      style={{color: 'white'}} 
    />

    <button 
      style={{...estilos.btnGuardar, background: '#f39c12'}} 
      onClick={publicarProyecto}
    >
      🚀 Publicar
    </button>
  </div>
</div>


      <h2 style={estilos.tituloSeccion}>Mi Portafolio</h2>
      <div style={estilos.gridObras}>
        {obras.length > 0 ? obras.map((obra) => (
          <div key={obra.id} style={estilos.tarjetaObra} onClick={() => abrirProyecto(obra)}>
            {obra.tipo_archivo === 'video' ? <video src={obra.archivo_url} style={estilos.imgObra} /> :
             <img src={obra.archivo_url} alt={obra.titulo} style={estilos.imgObra} />}
            
            <div style={estilos.infoObra}>
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px'}}>
                <h3 style={{margin: 0}}>{obra.titulo}</h3>
                <div style={estilos.statsPrivadas}>
                  <button onClick={(e) => manejarLike(e, obra.id, obra.miLike)} style={estilos.btnLikePrivado} title={obra.miLike ? 'Quitar like' : 'Dar like'}>
                    {obra.miLike ? '❤️' : '🤍'} {obra.totalLikes}
                  </button>
                  <span title="Comentarios" style={{marginLeft: '10px'}}>💬 {obra.comentarios?.[0]?.count || 0}</span>
                </div>
              </div>
              
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  borrarProyecto(obra.id);
                }} 
                style={{color: '#e74c3c', border:'none', background:'none', cursor:'pointer', fontSize: '0.8em'}}
              >
                🗑️ Eliminar
              </button>
            </div>
          </div>
        )) : <div style={estilos.sinObras}>Sube tu primer proyecto arriba 🚀</div>}
      </div>

      {/* MODAL DE COMENTARIOS */}
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  {editandoTitulo ? (
                    <>
                      <input
                        value={tituloEditando}
                        onChange={(e) => setTituloEditando(e.target.value)}
                        maxLength={20}
                        style={{ ...estilos.inputText, background: '#121212', color: 'white', flex: 1 }}
                      />
                      <button onClick={actualizarTituloProyecto} style={estilos.btnResponder}>💾</button>
                      <button onClick={() => { setEditandoTitulo(false); setTituloEditando(proyectoSeleccionado.titulo || ''); }} style={estilos.btnBorrar}>✕</button>
                    </>
                  ) : (
                    <>
                      <h2 style={estilos.modalTitulo}>{proyectoSeleccionado.titulo}</h2>
                      <button onClick={() => setEditandoTitulo(true)} style={estilos.btnResponder}>✏️</button>
                    </>
                  )}
                </div>
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
      currentUserId={usuario?.id}
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
                  <button type="submit" disabled={enviandoComentario} style={estilos.btnEnviarComment}>
                    {enviandoComentario ? '...' : '➤'}
                  </button>
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
  dashboard: { maxWidth: '1200px', margin: '0 auto', padding: '20px', fontFamily: 'Segoe UI, sans-serif' },
  navBar: { background: 'white', padding: '15px 30px', borderRadius: '15px 15px 0 0', display: 'flex', gap: '10px', boxShadow: '0 5px 20px rgba(0,0,0,0.1)' },
  btnHamburguesa: { background: '#f07e11', color: 'white', padding: '10px 20px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 10px rgba(240, 126, 17, 0.3)' },
  menuDesplegable: { position: 'absolute', top: '100%', left: 0, marginTop: '10px', background: 'white', borderRadius: '12px', boxShadow: '0 5px 25px rgba(0,0,0,0.2)', padding: '10px', display: 'flex', flexDirection: 'column', gap: '5px', minWidth: '220px', zIndex: 100 },
  menuItem: { background: 'transparent', border: 'none', padding: '12px 15px', textAlign: 'left', cursor: 'pointer', borderRadius: '8px', fontSize: '15px', color: '#333', width: '100%', display: 'block', fontWeight: '500' },
  btnNav: { background: '#4a90e2', color: 'white', padding: '10px 20px', border: 'none', borderRadius: '8px', cursor: 'pointer' },
  btnCerrar: { background: '#e74c3c', color: 'white', padding: '10px 20px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' },
  perfilHeader: { textAlign: 'center', marginBottom: '40px', padding: '40px 30px', borderRadius: '0 0 20px 20px', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' },
  fotoPerfil: { width: '130px', height: '130px', borderRadius: '50%', objectFit: 'cover', border: '6px solid white', marginBottom: '15px' },
  nombreUsuario: { fontSize: '2.8em', color: 'white', fontWeight: 'bold' },
  bioUsuario: { 
    color: 'white', 
    fontSize: '1.2em', 
    maxWidth: '600px',
    margin: '0 auto 30px',
    wordWrap: 'break-word',
    whiteSpace: 'pre-wrap',
    lineHeight: '1.4',
    backgroundColor: 'rgba(0,0,0,0.45)',
    padding: '10px 14px',
    borderRadius: '14px'
  },
  configPerfil: { background: 'rgba(255,255,255,0.95)', padding: '25px', borderRadius: '18px', textAlign: 'left' },
  configRow: { display: 'flex', gap: '15px', flexWrap: 'wrap', alignItems: 'flex-end', marginBottom: '15px' },
  configGrupo: { display: 'flex', flexDirection: 'column', gap: '5px', flex: '1' },
  configGrupoColor: { display: 'flex', flexDirection: 'column', gap: '5px', alignItems: 'center' },
  label: { fontSize: '12px', color: '#666', fontWeight: 'bold' },
  inputColor: { width: '50px', height: '45px', cursor: 'pointer' },
  inputText: { padding: '12px', borderRadius: '10px', border: '1px solid #ddd', flex: '2' },
  inputFileSmall: { fontSize: '11px' },
  btnGuardar: { background: '#27ae60', color: 'white', padding: '12px 25px', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold' },
  subirObra: { padding: '30px', borderRadius: '20px', marginBottom: '30px', color: 'white' },
  gridObras: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' },
  tituloSeccion: { color: 'white', marginBottom: '20px', fontSize: '1.8em' },
  tarjetaObra: { background: 'white', borderRadius: '15px', overflow: 'hidden', cursor: 'pointer' },
  imgObra: { width: '100%', height: '180px', objectFit: 'cover' },
  infoObra: { padding: '15px' },
  sinObras: { gridColumn: '1/-1', textAlign: 'center', color: 'rgba(255,255,255,0.6)', padding: '60px' },
  statsPrivadas: { background: '#f8f9fa', padding: '5px 10px', borderRadius: '8px', fontSize: '0.85em', color: '#555', display: 'flex', alignItems: 'center', border: '1px solid #eee' },
  overlay: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
  modal: { width: '85%', maxWidth: '1000px', height: '75vh', background: '#111', borderRadius: '25px', overflow: 'hidden' },
  modalContent: { display: 'flex', height: '100%' },
  modalMedia: { flex: 1.5, background: '#000', display: 'flex', alignItems: 'center' },
  mediaFull: { width: '100%', height: '100%', objectFit: 'contain' },
  modalSide: { flex: 1, padding: '25px', display: 'flex', flexDirection: 'column', color: 'white' },
  btnClose: { alignSelf: 'flex-end', background: 'none', border: 'none', color: 'white', fontSize: '24px', cursor: 'pointer' },
  modalTitulo: { color: '#f07e11', margin: '10px 0' },
  descripcionText: { fontSize: '0.95em', color: '#ccc', marginBottom: '20px', lineHeight: '1.4', whiteSpace: 'pre-wrap', overflowWrap: 'break-word', wordBreak: 'break-word', background: 'rgba(0,0,0,0.55)', padding: '14px', borderRadius: '12px' },
  listaComentarios: { flex: 1, overflowY: 'auto' },
  
  // CORREGIDO: Fusionamos comentarioItem en uno solo y agregamos la coma que faltaba arriba
  comentarioItem: { 
    display: 'flex', 
    gap: '10px', 
    marginBottom: '15px', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    padding: '8px 0',
    borderBottom: '1px solid #333' // Color oscuro para que combine con tu modal
  },
  
  miniAvatarComment: { width: '30px', height: '30px', borderRadius: '50%' },
  textoComentario: { fontSize: '0.9em', margin: 0, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', wordBreak: 'break-all' },
  formComentario: { display: 'flex', gap: '10px', marginTop: '10px' },
  inputComentario: { flex: 1, background: '#222', border: '1px solid #444', color: 'white', padding: '10px', borderRadius: '10px' },
  btnEnviarComment: { background: '#f07e11', border: 'none', padding: '0 15px', borderRadius: '10px', cursor: 'pointer' }, // <-- Faltaba coma aquí
  
  btnBorrarComentario: {
    background: 'none',
    border: 'none',
    color: '#e74c3c',
    cursor: 'pointer',
    fontSize: '1em',
    padding: '5px',
    marginLeft: '10px',
    transition: 'transform 0.2s'
  },

  btnLikePrivado: { background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.85em', padding: '0' },
  burbujaNotificaciones: {
    position: 'absolute',
    top: '-6px',
    right: '-8px',
    background: '#e74c3c',
    color: 'white',
    borderRadius: '50%',
    padding: '2px 7px',
    fontSize: '0.7em',
    lineHeight: '1',
    fontWeight: 'bold'
  }
};


export default Dashboard;