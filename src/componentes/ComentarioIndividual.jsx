import React from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Trash2, Pencil, Save, Send, Flag } from 'lucide-react';

// Comentario con soporte de respuestas anidadas: se renderiza a sí mismo
// para pintar el árbol completo de respuestas.
const ComentarioIndividual = ({
  comentario,
  todosLosComentarios,
  alResponder,
  alBorrar,
  respondiendoA,
  enviarRespuesta,
  textoRespuesta,
  setTextoRespuesta,
  currentUserId,
  comentarioEditandoId,
  comentarioEditandoTexto,
  setComentarioEditandoId,
  setComentarioEditandoTexto,
  actualizarComentario,
  // true cuando la publicación vista es del usuario logueado (puede moderar).
  esMiPublicacion = false,
  // callback opcional para reportar (solo comentarios ajenos en posts ajenos).
  alReportar = null,
}) => {
  const navigate = useNavigate();
  const hijos = todosLosComentarios.filter((h) => String(h.parent_id) === String(comentario.id));
  const esPropio = String(comentario.usuario_id) === String(currentUserId);
  const estaEditando = String(comentarioEditandoId) === String(comentario.id);
  // Solo el autor del comentario o el dueño de la publicación pueden borrar.
  const puedeBorrar = esPropio || esMiPublicacion;

  const irAPerfil = () => {
    if (!esPropio && comentario.usuario_id) {
      navigate(`/perfil/${comentario.usuario_id}`);
    }
  };

  return (
    <div className={comentario.parent_id ? 'comentario anidado' : 'comentario'}>
      <img
        src={comentario.perfiles?.avatar_url || 'https://via.placeholder.com/40?text=U'}
        className={`avatar avatar-sm ${esPropio ? '' : 'cursor-pointer'}`}
        alt=""
        onClick={esPropio ? undefined : irAPerfil}
      />

      <div className="comentario-cuerpo">
        <button
          type="button"
          className={`comentario-autor ${esPropio ? 'propio' : ''}`}
          onClick={esPropio ? undefined : irAPerfil}
        >
          {comentario.perfiles?.nombre_completo}
        </button>

        {estaEditando ? (
          <div className="fila-respuesta sin-margen-izq">
            <input
              value={comentarioEditandoTexto}
              onChange={(e) => setComentarioEditandoTexto(e.target.value)}
              className="campo"
            />
            <button
              type="button"
              onClick={() => actualizarComentario(comentario.id, comentarioEditandoTexto)}
              className="accion exito"
              title="Guardar"
            >
              <Save size={15} />
            </button>
            <button
              type="button"
              onClick={() => {
                setComentarioEditandoId(null);
                setComentarioEditandoTexto('');
              }}
              className="accion peligro"
              title="Cancelar"
            >
              <X size={15} />
            </button>
          </div>
        ) : (
          <>
            <p className="comentario-texto">{comentario.contenido}</p>
            <div className="comentario-acciones">
              <button type="button" onClick={() => alResponder(comentario.id)} className="accion">
                Responder
              </button>
              {alReportar && !esPropio && !esMiPublicacion && (
                <button
                  type="button"
                  onClick={() => alReportar(comentario)}
                  className="accion"
                  title="Reportar comentario"
                >
                  <Flag size={13} />
                </button>
              )}
              {esPropio && (
                <button
                  type="button"
                  onClick={() => {
                    setComentarioEditandoId(comentario.id);
                    setComentarioEditandoTexto(comentario.contenido);
                  }}
                  className="accion"
                  title="Editar comentario"
                >
                  <Pencil size={13} />
                </button>
              )}
            </div>
          </>
        )}

        {respondiendoA === comentario.id && (
          <div className="fila-respuesta">
            <input
              type="text"
              placeholder="Escribe tu respuesta..."
              className="campo"
              value={textoRespuesta}
              onChange={(e) => setTextoRespuesta(e.target.value)}
              autoFocus
            />
            <button
              type="button"
              onClick={() => enviarRespuesta(comentario.id)}
              className="btn-enviar-comentario chico"
              title="Enviar respuesta"
            >
              <Send size={15} />
            </button>
          </div>
        )}

        {hijos.map((hijo) => (
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
            esMiPublicacion={esMiPublicacion}
            alReportar={alReportar}
          />
        ))}
      </div>

      {puedeBorrar && (
        <button
          type="button"
          onClick={() => alBorrar(comentario.id)}
          className="accion peligro"
          title="Eliminar comentario"
        >
          <Trash2 size={15} />
        </button>
      )}
    </div>
  );
};

export default ComentarioIndividual;
