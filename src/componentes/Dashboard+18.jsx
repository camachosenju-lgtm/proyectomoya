import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import { validarPerfil, validarProyecto } from './validaciones';
import { moderador } from './moderacion';
import '../estilos/perfil.css';
import { Menu, Image as ImageIcon, Activity, LogOut, Heart, MessageCircle, Trash2, Pencil, Save, X, Send, Palette, Settings, ChevronLeft, ChevronRight } from 'lucide-react';


const STORAGE_KEY_NOTIF_LEIDAS = 'pocketwork_notificaciones_leidas';
const STORAGE_KEY_BIENVENIDA_ADULTO = 'pocketwork_bienvenida_adulto';
const PLANTILLAS_DISPONIBLES = Array.from({ length: 50 }, (_, index) => `/imagenes/plantillas/textura${index + 1}.png`);
const estiloFlechaCarrusel = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  width: '28px',
  height: '36px',
  padding: 0,
  border: '1px solid rgba(0,0,0,0.12)',
  borderRadius: '8px',
  background: '#fff',
  color: '#444',
  cursor: 'pointer'
};

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
      <div className="comentarioItem">
        <img
          src={comentario.perfiles?.avatar_url || "..."}
          className="miniAvatarComment" style={{ cursor: esPropio ? 'default' : 'pointer' }}
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
                className="inputComentario" style={{ fontSize: '0.85em', minWidth: '0' }}
              />
              <button
                onClick={() => actualizarComentario(comentario.id, comentarioEditandoTexto)}
                className="btnResponder"
              ><Save size={16} /></button>
              <button
                onClick={() => { setComentarioEditandoId(null); setComentarioEditandoTexto(''); }}
                className="btnBorrar"
              ><X size={16} /></button>
            </div>
          ) : (
            <>
              <p className="textoComentario">{comentario.contenido}</p>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => alResponder(comentario.id)} className="btnResponder">Responder</button>
                {esPropio && (
                  <button
                    onClick={() => {
                      setComentarioEditandoId(comentario.id);
                      setComentarioEditandoTexto(comentario.contenido);
                    }}
                    className="btnResponder"
                  ><Pencil size={14} /></button>
                )}
              </div>
            </>
          )}
        </div>
        <button onClick={() => alBorrar(comentario.id)} className="btnBorrar"><Trash2 size={16} /></button>
      </div>

      {/* INPUT DE RESPUESTA SI ESTÁ ACTIVO */}
      {respondiendoA === comentario.id && (
        <div style={{ marginTop: '10px', display: 'flex', gap: '5px', marginLeft: '20px' }}>
          <input
            type="text"
            placeholder="Escribe tu respuesta..."
            className="inputComentario"
            value={textoRespuesta}
            onChange={(e) => setTextoRespuesta(e.target.value)}
            autoFocus
          />
          <button
            onClick={() => enviarRespuesta(comentario.id)}
            className="btnEnviarComment" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <Send size={16} />
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
    colorPrincipal: '#ee8f00',
    colorSecundario: '#d17b18',
    colorFondoWeb: '#0f0e0e',
    colorLetraNombre: '#ffffff',
    colorLetraBio: '#ffffff',
    avatarUrl: null,
    imagenFondoUrl: null
  });
  const [plantillaEnVistaPrevia, setPlantillaEnVistaPrevia] = useState(null);
  const carruselPlantillasRef = useRef(null);

  const [obras, setObras] = useState([]);
  const [nuevaObra, setNuevaObra] = useState({ titulo: '', descripcion: '', imagenUrl: '' });
  const [contenidoExplicito, setContenidoExplicito] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [perfilAdultoVerificado, setPerfilAdultoVerificado] = useState(false);

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
  const [mostrarModalSalir, setMostrarModalSalir] = useState(false);
  const [mostrarBienvenidaAdulto, setMostrarBienvenidaAdulto] = useState(false);
  const [desvaneciendoBienvenida, setDesvaneciendoBienvenida] = useState(false);

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
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) throw error;
        if (!user) {
          navigate('/login', { replace: true });
          return;
        }

        setUsuario(user);
        const perfilActual = await cargarPerfil(user.id);
        if (!perfilActual) {
          await supabase.auth.signOut();
          navigate('/login', { replace: true });
          return;
        }
        if (perfilActual.tipo_cuenta !== 'adulto') {
          navigate('/dashboard', { replace: true });
          return;
        }
        setPerfilAdultoVerificado(true);

        const claveBienvenida = `${STORAGE_KEY_BIENVENIDA_ADULTO}_${user.id}`;
        if (!localStorage.getItem(claveBienvenida)) {
          localStorage.setItem(claveBienvenida, 'mostrada');
          setMostrarBienvenidaAdulto(true);
        }
      } catch (error) {
        console.error('Error al inicializar el dashboard +18:', error);
        alert(`No se pudo cargar tu perfil: ${error.message}`);
        await supabase.auth.signOut();
        navigate('/login', { replace: true });
      } finally {
        setCargando(false);
      }
    };
    inicializar();
  }, [navigate]);

  useEffect(() => {
    if (!mostrarBienvenidaAdulto) return undefined;

    const temporizadorDesvanecer = setTimeout(() => setDesvaneciendoBienvenida(true), 3600);
    const temporizadorCerrar = setTimeout(() => setMostrarBienvenidaAdulto(false), 4300);
    return () => {
      clearTimeout(temporizadorDesvanecer);
      clearTimeout(temporizadorCerrar);
    };
  }, [mostrarBienvenidaAdulto]);

  useEffect(() => {
    if (usuario && perfilAdultoVerificado) {
      cargarObrasConStats();
    }
  }, [usuario, perfilAdultoVerificado]);

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
    if (usuario && perfilAdultoVerificado && obras.length > 0) {
      cargarNotificaciones();
    }
  }, [obras, usuario, perfilAdultoVerificado]);

  // EFECTO 2: El intervalo (Asegúrate de que use la versión fresca de la función)
  useEffect(() => {
    const intervalo = setInterval(() => {
      if (perfilAdultoVerificado) cargarNotificaciones();
    }, 20000);
    return () => clearInterval(intervalo);
  }, [obras, usuario, perfilAdultoVerificado]);


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

    const textoParaValidar = contenido.trim();

    const { data, error } = await supabase
      .from('comentarios')
      .update({ contenido: textoParaValidar }) // Usamos el texto ya validado
      .eq('id', comentarioId)
      .eq('usuario_id', usuario?.id)
      .select('*');

    if (error) {
      alert('Error al actualizar comentario: ' + error.message);
      console.error(error);
      return;
    }

    // ... (El resto de tu lógica de verificación y actualización de estado está bien)

    setComentarios(prev => prev.map(c => c.id === comentarioId ? { ...c, contenido: textoParaValidar } : c));
    setComentarioEditandoId(null);
    setComentarioEditandoTexto('');
    if (proyectoSeleccionado?.id) await fetchComentarios(proyectoSeleccionado.id);
    await cargarObrasConStats();
};

  const actualizarTituloProyecto = async () => {
    if (!proyectoSeleccionado) return;

    const tituloParaValidar = tituloEditando.trim(); // Guardamos el texto limpio

    if (!tituloParaValidar) {
      alert('El título no puede estar vacío.');
      return;
    }
    if (tituloParaValidar.length > 20) {
      alert('El título es demasiado largo (máximo 20 caracteres).');
      return;
    }

    const { data, error } = await supabase
      .from('proyectos')
      .update({ titulo: tituloParaValidar }) // Usamos el texto ya moderado
      .eq('id', proyectoSeleccionado.id)
      .select('*');

    if (error) {
      alert('Error al actualizar el título: ' + error.message);
      console.error(error);
      return;
    }

    // ... (El resto de tu lógica de verificación está perfecta)

    const { data: verifico, error: errorVerifico } = await supabase
      .from('proyectos')
      .select('titulo')
      .eq('id', proyectoSeleccionado.id)
      .single();

    if (errorVerifico || (!verifico || verifico.titulo !== tituloParaValidar)) {
      alert('No se pudo validar el título en la base de datos.');
      return;
    }

    setProyectoSeleccionado(prev => ({ ...prev, titulo: tituloParaValidar }));
    setObras(prev => prev.map(o => o.id === proyectoSeleccionado.id ? { ...o, titulo: tituloParaValidar } : o));
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

    if (error) {
      console.error('Error cargando perfil +18:', error.message);
      throw error;
    }

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
    return data;
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

    if (!usuario) return alert("Espera a que cargue tu sesión...");
    setCargando(true);

    const datosParaDB = {
      id: usuario.id,
      nombre_completo: perfil.nombre,
      biografia: perfil.bio,
      color_principal: perfil.colorPrincipal,
      color_secundario: perfil.colorSecundario,
      color_fondo_web: perfil.colorFondoWeb,
      imagen_fondo_url: perfil.imagenFondoUrl,
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
    let archivoSubido = false;

    try {
      // Subida al Bucket 'Proyectos'
      const { error: uploadError } = await supabase.storage
        .from('Proyectos')
        .upload(nombreArchivo, archivo);

      if (uploadError) throw uploadError;
      archivoSubido = true;

      // Obtener la URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('Proyectos')
        .getPublicUrl(nombreArchivo);

      if (archivo.type.startsWith('image') || archivo.type.startsWith('video')) {
        const resultadoModeracion = contenidoExplicito
          ? await moderador.validarMediaGore(publicUrl)
          : await moderador.validarMediaNoExplicita(publicUrl);
        if (!resultadoModeracion.seguro) {
          const { error: errorEliminar } = await supabase.storage.from('Proyectos').remove([nombreArchivo]);
          if (errorEliminar) {
            console.error('No se pudo eliminar el archivo bloqueado:', errorEliminar.message);
          }
          archivoSubido = false;
          alert(contenidoExplicito
            ? '❌ Archivo bloqueado: se detectó contenido gore.'
            : '❌ Archivo bloqueado: no es apto para una publicación no explícita.');
          event.target.value = "";
          setCargando(false);
          return;
        }
      }

      // Guardamos la URL en el estado temporal para que el botón de publicar la use
      setNuevaObra(prev => ({ ...prev, imagenUrl: publicUrl }));

      alert("✅ Archivo cargado correctamente. Ahora puedes ponerle un título y publicar.");

    } catch (err) {
      if (archivoSubido) {
        const { error: errorEliminar } = await supabase.storage.from('Proyectos').remove([nombreArchivo]);
        if (errorEliminar) {
          console.error('No se pudo eliminar el archivo tras fallar la moderación:', errorEliminar.message);
        }
      }
      alert("❌ Error al subir el archivo: " + err.message);
      console.error(err);
      setCargando(false);
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

    // 2. Lógica para detectar el tipo de archivo automáticamente
    let tipoDetectado = 'imagen';
    const urlLower = nuevaObra.imagenUrl.toLowerCase();

    if (urlLower.match(/\.(mp4|webm|ogg|mov)$/i)) {
      tipoDetectado = 'video';
    } else if (urlLower.match(/\.(mp3|wav|flac|aac)$/i)) {
      tipoDetectado = 'audio';
    }

    setCargando(true);
    try {
      if (tipoDetectado !== 'audio') {
        const resultadoModeracionMedia = contenidoExplicito
          ? await moderador.validarMediaGore(nuevaObra.imagenUrl)
          : await moderador.validarMediaNoExplicita(nuevaObra.imagenUrl);
        if (!resultadoModeracionMedia.seguro) {
          alert(contenidoExplicito
            ? '❌ Proyecto bloqueado: se detectó contenido gore.'
            : '❌ Proyecto bloqueado: el archivo contiene material no apto para usuarios estándar.');
          return;
        }
      }

      // 3. Inserción en Supabase
      const { error } = await supabase.from('proyectos').insert([
        {
          usuario_id: usuario.id,
          titulo: nuevaObra.titulo,
          archivo_url: nuevaObra.imagenUrl,
          tipo_archivo: tipoDetectado,
          es_nsfw: contenidoExplicito
        }
      ]);

      if (error) throw error;

      alert(`🚀 ¡Proyecto (${tipoDetectado}) publicado con éxito!`);

      // 4. Limpiar el formulario y recargar la lista
      setNuevaObra({ titulo: '', descripcion: '', imagenUrl: '' });
      setContenidoExplicito(false);
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
    let archivoSubido = true;
    try {
      const resultadoModeracion = await moderador.validarMediaGore(publicUrl);
      if (!resultadoModeracion.seguro) {
        const { error: errorEliminar } = await supabase.storage.from(nombreBucket).remove([nombreArchivo]);
        if (errorEliminar) {
          console.error('No se pudo eliminar la imagen bloqueada:', errorEliminar.message);
        }
        archivoSubido = false;
        alert('❌ Imagen bloqueada: se detectó contenido gore.');
        event.target.value = "";
        setCargando(false);
        return;
      }
    } catch (err) {
      if (archivoSubido) {
        const { error: errorEliminar } = await supabase.storage.from(nombreBucket).remove([nombreArchivo]);
        if (errorEliminar) {
          console.error('No se pudo eliminar la imagen tras fallar la moderación:', errorEliminar.message);
        }
      }
      alert('Error al moderar la imagen: ' + err.message);
      event.target.value = "";
      setCargando(false);
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

  const aplicarPlantilla = async (numero) => {
    const url = `/imagenes/plantillas/textura${numero}.png`;
    setPerfil(prev => ({ ...prev, imagenFondoUrl: url }));

    if (usuario?.id) {
      const { error } = await supabase
        .from('perfiles')
        .update({ imagen_fondo_url: url })
        .eq('id', usuario.id);

      if (error) {
        alert('❌ No se pudo guardar la plantilla: ' + error.message);
      }
    }
  };

  if (cargando || !perfilAdultoVerificado) return <div style={{ color: 'white', padding: '50px', textAlign: 'center' }}>Cargando...</div>;

  return (
    <section className="dashboard">
      {mostrarBienvenidaAdulto && (
        <div
          role="status"
          aria-live="polite"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 2000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            background: 'rgba(0,0,0,0.82)',
            backdropFilter: 'blur(8px)',
            opacity: desvaneciendoBienvenida ? 0 : 1,
            transition: 'opacity 700ms ease',
            pointerEvents: 'none'
          }}
        >
          <div
            style={{
              width: 'min(520px, 100%)',
              padding: '38px 30px',
              borderRadius: '22px',
              border: '1px solid rgba(240,126,17,0.65)',
              background: 'linear-gradient(145deg, #21150e, #101010 70%)',
              color: '#fff',
              textAlign: 'center',
              boxShadow: '0 20px 70px rgba(0,0,0,0.55)',
              transform: desvaneciendoBienvenida ? 'translateY(-12px) scale(0.98)' : 'translateY(0) scale(1)',
              transition: 'transform 700ms ease'
            }}
          >
            <span style={{ display: 'block', color: '#f07e11', fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase' }}>
              Pocketwork
            </span>
            <h1 style={{ margin: '12px 0', fontSize: 'clamp(1.7rem, 5vw, 2.4rem)' }}>
              Bienvenido a la zona +18
            </h1>
            <p style={{ margin: 0, color: '#d4d4d4', lineHeight: 1.6 }}>
              Disfruta y comparte contenido para adultos de forma responsable. El contenido violento o gore no está permitido.
            </p>
          </div>
        </div>
      )}
      <div className="navBar">
        <div style={{ position: 'relative' }}>
          <button
            className="btnHamburguesa"
            onClick={() => setMenuAbierto(!menuAbierto)}
          >
            <div key={menuAbierto ? 'open' : 'closed'} className="icon-spin-animate" style={{ display: 'flex', alignItems: 'center' }}>
              {menuAbierto ? <X size={18} /> : <Menu size={18} />}
            </div>
            Menú
          </button>

          {menuAbierto && (
            <div className="menuDesplegable menu-dropdown-animate">
              <button
                onClick={() => { setMenuAbierto(false); navigate('/galeria'); }}
                className="menuItem" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <ImageIcon size={18} /> Galería
              </button>
              <button
                onClick={() => { setMenuAbierto(false); navigate('/notificaciones'); }}
                className="menuItem" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <Activity size={18} /> Ver actividad
              </button>
              <div style={{ borderTop: '1px solid #eee', margin: '5px 0' }}></div>
              <button
                className="menuItem" style={{ color: '#e74c3c', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}
                onClick={() => { setMenuAbierto(false); setMostrarModalSalir(true); }}
              >
                <LogOut size={18} /> Cerrar Sesión
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="perfilHeader" style={{ background: obtenerFondoHeader() }}>
        <img className="fotoPerfil" src={perfil.avatarUrl || "https://via.placeholder.com/120?text=👤"} alt="Perfil" />
        <h1 className="nombreUsuario" style={{ color: perfil.colorLetraNombre }}>{perfil.nombre}</h1>
        <p className="bioUsuario" style={{ color: perfil.colorLetraBio }}>{perfil.bio}</p>

        <div className="configPerfil" style={{ padding: '14px 18px', maxHeight: '38vh', overflowY: 'auto' }}>
          <h4 style={{ color: '#333', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}><Settings size={20} /> Personalizar mi espacio</h4>
          <div className="configRow">
            <div className="configGrupo">
              <label className="label">Foto Perfil (Auto):</label>
              <label htmlFor="upload-avatar" className="btnSubirArchivo">
                <ImageIcon size={14} /> Elegir Foto
              </label>
              <input id="upload-avatar" type="file" accept="image/*" onChange={(e) => subirImagen(e, 'Avatares', 'avatar_url', 'avatarUrl')} style={{ display: 'none' }} />
            </div>
            <input
              type="text"
              maxLength={25} // <--- NO DEJA ESCRIBIR MÁS DE 25
              className="inputText"
              placeholder="Nombre de usuario"
              value={perfil.nombre}
              onChange={(e) => setPerfil({ ...perfil, nombre: e.target.value })}
            />
            <textarea
              maxLength={150} // <--- NO DEJA ESCRIBIR MÁS DE 150
              className="inputText" style={{ height: '60px', resize: 'none' }}
              placeholder="Describe tu perfil..."
              value={perfil.bio}
              onChange={(e) => setPerfil({ ...perfil, bio: e.target.value })}
            />
          </div>

          <div className="configRow">
            <div className="configGrupoColor"><label className="label">Fondo Web:</label><input type="color" value={perfil.colorFondoWeb} className="inputColor" onChange={(e) => setPerfil({ ...perfil, colorFondoWeb: e.target.value })} /></div>
            <div className="configGrupoColor"><label className="label">Cuadro:</label><input type="color" value={perfil.colorSecundario} className="inputColor" onChange={(e) => setPerfil({ ...perfil, colorSecundario: e.target.value })} /></div>
            <div className="configGrupoColor"><label className="label">Color texto nombre:</label><input type="color" value={perfil.colorLetraNombre} className="inputColor" onChange={(e) => setPerfil({ ...perfil, colorLetraNombre: e.target.value })} /></div>
            <div className="configGrupoColor"><label className="label">Color texto bio:</label><input type="color" value={perfil.colorLetraBio} className="inputColor" onChange={(e) => setPerfil({ ...perfil, colorLetraBio: e.target.value })} /></div>
            <div className="configGrupo">
              <label className="label">Fondo (Auto):</label>
              <label htmlFor="upload-fondo" className="btnSubirArchivo">
                <ImageIcon size={14} /> Elegir Fondo
              </label>
              <input id="upload-fondo" type="file" onChange={(e) => subirImagen(e, 'Fondos', 'imagen_fondo_url', 'imagenFondoUrl')} style={{ display: 'none' }} />
            </div>

            <div className="configGrupo" style={{ minWidth: '230px' }}>
              <label className="label">Plantilla (Auto):</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input
                  type="number"
                  min="1"
                  max="50"
                  className="inputText"
                  placeholder="Ej: 1"
                  onChange={async (e) => {
                    const num = parseInt(e.target.value);
                    if (num >= 1 && num <= 50) {
                      await aplicarPlantilla(num);
                    } else if (num) {
                      alert('Plantilla no disponible. Solo hay plantillas del 1 al 50.');
                      e.target.value = '';
                    }
                  }}
                  style={{ flex: 1 }}
                />
              </div>

              <div
                style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}
                onMouseLeave={() => setPlantillaEnVistaPrevia(null)}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '8px',
                    fontSize: '0.72em',
                    color: '#555',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em'
                  }}
                >
                  <span>Pasa el cursor para previsualizar</span>
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    position: 'relative',
                    zIndex: 2
                  }}
                >
                  <button
                    type="button"
                    aria-label="Ver plantillas anteriores"
                    onClick={() => carruselPlantillasRef.current?.scrollBy({ left: -240, behavior: 'smooth' })}
                    style={estiloFlechaCarrusel}
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <div
                    ref={carruselPlantillasRef}
                    onWheel={(e) => {
                      if (carruselPlantillasRef.current) {
                        e.preventDefault();
                        carruselPlantillasRef.current.scrollLeft += e.deltaY || e.deltaX;
                      }
                    }}
                    style={{
                      display: 'flex',
                      flex: 1,
                      gap: '6px',
                      overflowX: 'auto',
                      padding: '8px 4px 10px',
                      scrollBehavior: 'smooth',
                      WebkitOverflowScrolling: 'touch',
                      scrollbarWidth: 'thin',
                      touchAction: 'pan-x'
                    }}
                  >
                  {PLANTILLAS_DISPONIBLES.map((url, index) => {
                    const activo = perfil.imagenFondoUrl === url;
                    return (
                      <button
                        key={url}
                        type="button"
                        style={{
                          position: 'relative',
                          border: activo ? '2px solid #f07e11' : '1px solid rgba(0,0,0,0.15)',
                          borderRadius: '12px',
                          padding: 0,
                          background: '#fff',
                          cursor: 'pointer',
                          minWidth: '52px',
                          width: '52px',
                          height: '52px',
                          overflow: 'hidden',
                          boxShadow: activo ? '0 0 0 3px rgba(240,126,17,0.18)' : '0 4px 10px rgba(0,0,0,0.06)',
                          transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease',
                          transform: activo ? 'translateY(-2px)' : 'translateY(0)'
                        }}
                        title={`Plantilla ${index + 1}`}
                        onMouseEnter={() => setPlantillaEnVistaPrevia(index + 1)}
                        onFocus={() => setPlantillaEnVistaPrevia(index + 1)}
                        onClick={() => aplicarPlantilla(index + 1)}
                      >
                        <img
                          src={url}
                          alt={`Plantilla ${index + 1}`}
                          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                        />
                        <span
                          style={{
                            position: 'absolute',
                            bottom: 0,
                            left: 0,
                            right: 0,
                            background: 'linear-gradient(180deg, transparent, rgba(0,0,0,0.7))',
                            color: '#fff',
                            fontSize: '0.62em',
                            fontWeight: 700,
                            padding: '2px 4px',
                            textAlign: 'center'
                          }}
                        >
                          {index + 1}
                        </span>
                      </button>
                    );
                  })}
                  </div>
                  <button
                    type="button"
                    aria-label="Ver plantillas siguientes"
                    onClick={() => carruselPlantillasRef.current?.scrollBy({ left: 240, behavior: 'smooth' })}
                    style={estiloFlechaCarrusel}
                  >
                    <ChevronRight size={18} />
                  </button>
                  <div
                    style={{
                      position: 'absolute',
                      left: '50%',
                      top: '-8px',
                      width: '220px',
                      height: '132px',
                      borderRadius: '14px',
                      overflow: 'hidden',
                      background: '#171717',
                      border: '2px solid #fff',
                      boxShadow: '0 12px 30px rgba(0,0,0,0.3)',
                      opacity: plantillaEnVistaPrevia ? 1 : 0,
                      visibility: plantillaEnVistaPrevia ? 'visible' : 'hidden',
                      transform: plantillaEnVistaPrevia
                        ? 'translate(-50%, -100%) scale(1)'
                        : 'translate(-50%, -96%) scale(0.94)',
                      transition: 'opacity 180ms ease, transform 220ms ease, visibility 220ms ease',
                      pointerEvents: 'none'
                    }}
                    aria-hidden={!plantillaEnVistaPrevia}
                  >
                    {plantillaEnVistaPrevia && (
                      <>
                        <img
                          src={PLANTILLAS_DISPONIBLES[plantillaEnVistaPrevia - 1]}
                          alt={`Vista previa de la plantilla ${plantillaEnVistaPrevia}`}
                          style={{
                            display: 'block',
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover'
                          }}
                        />
                        <span
                          style={{
                            position: 'absolute',
                            left: '10px',
                            bottom: '10px',
                            borderRadius: '999px',
                            padding: '5px 10px',
                            background: 'rgba(0,0,0,0.7)',
                            color: '#fff',
                            fontSize: '0.75em',
                            fontWeight: 700
                          }}
                        >
                          Plantilla {plantillaEnVistaPrevia}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <button className="btnGuardar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }} onClick={guardarCambiosPerfil}><Save size={16} />Guardar cambios</button>
          </div>
        </div>
      </div>

      <div className="subirObra" style={{ background: perfil.colorSecundario }}>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Palette size={24} /> Publicar Nuevo Proyecto</h2>
        <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
          <input
            type="text"
            maxLength={20}
            placeholder="Título (máx 20)"
            className="inputText"
            value={nuevaObra.titulo}
            onChange={(e) => setNuevaObra({ ...nuevaObra, titulo: e.target.value })}
          />

          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              flexBasis: '100%',
              color: '#fff',
              cursor: 'pointer'
            }}
          >
            <input
              type="checkbox"
              checked={contenidoExplicito}
              onChange={(e) => setContenidoExplicito(e.target.checked)}
            />
            Marcar como contenido explícito (+18)
          </label>

          {/* CONECTAMOS LA FUNCIÓN AQUÍ */}
          <label htmlFor="upload-proyecto" className="btnSubirArchivo">
            <ImageIcon size={18} /> Subir foto
          </label>
          <input
            id="upload-proyecto"
            type="file"
            accept="image/*,video/*,audio/*"
            onChange={prepararArchivoProyecto}
            style={{ display: 'none' }}
          />

          <button
            className="btnGuardar"
            onClick={publicarProyecto}
          >
            <Send size={18} /> Publicar
          </button>
        </div>
      </div>

      <h2 className="tituloSeccion">Mi Portafolio</h2>
      <div className="gridObras">
        {obras.length > 0 ? obras.map((obra) => (
          <div key={obra.id} className="tarjetaObra" onClick={() => abrirProyecto(obra)}>
            {obra.tipo_archivo === 'video' ? <video src={obra.archivo_url} className="imgObra" /> :
              <img src={obra.archivo_url} alt={obra.titulo} className="imgObra" />}

            <div className="infoObra">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <h3 style={{ margin: 0 }}>{obra.titulo}</h3>
                <div className="statsPrivadas">
                  <button onClick={(e) => manejarLike(e, obra.id, obra.miLike)} className="btnLikePrivado" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }} title={obra.miLike ? 'Quitar like' : 'Dar like'}>
                    {obra.miLike ? <Heart size={14} fill="currentColor" color="#e74c3c" /> : <Heart size={14} color="#555" />} {obra.totalLikes}
                  </button>
                  <span title="Comentarios" style={{ marginLeft: '10px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}><MessageCircle size={14} /> {obra.comentarios?.[0]?.count || 0}</span>
                </div>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  borrarProyecto(obra.id);
                }}
                style={{ color: '#e74c3c', border: 'none', background: 'none', cursor: 'pointer', fontSize: '0.8em', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <Trash2 size={14} /> Eliminar
              </button>
            </div>
          </div>
        )) : <div className="sinObras">Sube tu primer proyecto arriba <Send size={16} style={{ verticalAlign: 'middle', marginLeft: '5px' }} /></div>}
      </div>

      {/* MODAL DE COMENTARIOS */}
      {
        proyectoSeleccionado && (
          <div className="overlay" onClick={() => setProyectoSeleccionado(null)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <div className="modalContent">
                <div className="modalMedia">
                  {proyectoSeleccionado.tipo_archivo === 'video' ?
                    <video src={proyectoSeleccionado.archivo_url} controls autoPlay className="mediaFull" /> :
                    <img src={proyectoSeleccionado.archivo_url} className="mediaFull" alt="" />
                  }
                </div>
                <div className="modalSide">
                  <button className="btnClose" onClick={() => {
                    setProyectoSeleccionado(null);
                    setRespondiendoA(null); // Limpiamos para que no se quede abierto al cambiar de post
                  }}                   ><X size={24} /></button>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                    {editandoTitulo ? (
                      <>
                        <input
                          value={tituloEditando}
                          onChange={(e) => setTituloEditando(e.target.value)}
                          maxLength={20}
                          className="inputText" style={{ background: '#121212', color: 'white', flex: 1 }}
                        />
                        <button onClick={actualizarTituloProyecto} className="btnResponder"><Save size={16} /></button>
                        <button onClick={() => { setEditandoTitulo(false); setTituloEditando(proyectoSeleccionado.titulo || ''); }} className="btnBorrar"><X size={16} /></button>
                      </>
                    ) : (
                      <>
                        <h2 className="modalTitulo">{proyectoSeleccionado.titulo}</h2>
                        <button onClick={() => setEditandoTitulo(true)} className="btnResponder" style={{ alignSelf: 'center' }}><Pencil size={18} /></button>
                      </>
                    )}
                  </div>
                  {proyectoSeleccionado.descripcion && (
                    <p className="descripcionText">{proyectoSeleccionado.descripcion}</p>
                  )}
                  <div className="listaComentarios">
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

                  <form onSubmit={enviarComentario} className="formComentario">
                    <input
                      className="inputComentario"
                      placeholder="Escribe un comentario..."
                      value={nuevoComentario}
                      onChange={(e) => setNuevoComentario(e.target.value)}
                    />
                    <button type="submit" disabled={enviandoComentario} className="btnEnviarComment" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {enviandoComentario ? '...' : <Send size={18} />}
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        )
      }
      {/* MODAL DE CONFIRMACIÓN PARA SALIR */}
      {mostrarModalSalir && (
        <div className="overlay" onClick={() => setMostrarModalSalir(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ width: '350px', height: 'fit-content', padding: '35px 25px', textAlign: 'center', background: '#ffffffff', border: `1px solid ${perfil.colorPrincipal}`, boxShadow: `0 10px 40px ${perfil.colorPrincipal}33` }}>
            <h2 style={{ color: '#000', marginBottom: '10px' }}>¿Deseas salir?</h2>
            <p style={{ color: '#696969ff', marginBottom: '25px', fontSize: '15px' }}>Tu sesión se cerrará de forma segura.</p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '15px' }}>
              <button
                onClick={() => setMostrarModalSalir(false)}
                className="btnCancelar"
              >
                No, quedarme
              </button>
              <button
                onClick={() => { setMostrarModalSalir(false); manejarCerrarSesion(); }}
                className="btnConfirmar"
              >
                <LogOut size={16} /> Sí, salir
              </button>
            </div>
          </div>
        </div>
      )}
    </section >
  );
};




export default Dashboard;
