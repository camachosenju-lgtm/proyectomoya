import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import AlertModal from './AlertModal';
import '../estilos/perfil.css';
import {
  ArrowLeft, ShieldAlert, Users, Flag, Trophy, BarChart3,
  Check, X, Trash2, Ban, Crown, Plus,
} from 'lucide-react';

// Panel de administración (solo tipo_cuenta === 'admin').
// Pestañas: reportes, usuarios, retos y resumen.
const Admin = () => {
  const navigate = useNavigate();
  const [cargando, setCargando] = useState(true);
  const [esAdmin, setEsAdmin] = useState(false);
  const [miId, setMiId] = useState(null);
  const [tab, setTab] = useState('reportes');
  const [stats, setStats] = useState({ usuarios: 0, proyectos: 0, pendientes: 0, retos: 0 });
  const [reportes, setReportes] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [retos, setRetos] = useState([]);
  const [nuevoReto, setNuevoReto] = useState({ titulo: '', descripcion: '', termina_el: '' });
  const [alerta, setAlerta] = useState({ visible: false, mensaje: '', tipo: 'info', titulo: '', onConfirm: null });

  const avisar = (mensaje, tipo = 'info', titulo) =>
    setAlerta({ visible: true, mensaje, tipo, titulo, onConfirm: null });
  const pedirConfirmacion = (mensaje, onConfirm, titulo = 'Confirmación') =>
    setAlerta({ visible: true, mensaje, tipo: 'confirm', titulo, onConfirm });

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }
      setMiId(user.id);
      const { data: perfil } = await supabase
        .from('perfiles').select('tipo_cuenta').eq('id', user.id).single();
      if (perfil?.tipo_cuenta !== 'admin') {
        setEsAdmin(false);
        setCargando(false);
        return;
      }
      setEsAdmin(true);
      await Promise.all([cargarStats(), cargarReportes(), cargarUsuarios(), cargarRetos()]);
      setCargando(false);
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const contar = async (tabla, extra = {}) => {
    const { count } = await supabase.from(tabla).select('id', { count: 'exact', head: true, ...extra });
    return count || 0;
  };

  const cargarStats = async () => {
    const [usuarios, proyectos, pendientes, retos] = await Promise.all([
      contar('perfiles'),
      contar('proyectos'),
      supabase.from('reportes').select('id', { count: 'exact', head: true }).eq('estado', 'pendiente')
        .then((r) => r.count || 0),
      contar('retos'),
    ]);
    setStats({ usuarios, proyectos, pendientes, retos });
  };

  const cargarReportes = async () => {
    const { data } = await supabase
      .from('reportes').select('*').order('creado_el', { ascending: false }).limit(100);
    setReportes(data || []);
  };

  const cargarUsuarios = async () => {
    const { data } = await supabase
      .from('perfiles').select('id, nombre_completo, tipo_cuenta, disponible_trabajo')
      .order('nombre_completo').limit(100);
    setUsuarios(data || []);
  };

  const cargarRetos = async () => {
    const { data } = await supabase
      .from('retos').select('*').order('creado_el', { ascending: false });
    setRetos(data || []);
  };

  const marcarReporte = async (id, estado) => {
    const { error } = await supabase.from('reportes').update({ estado }).eq('id', id);
    if (error) {
      avisar('Error: ' + error.message, 'error');
      return;
    }
    setReportes((prev) => prev.map((r) => (r.id === id ? { ...r, estado } : r)));
    cargarStats();
  };

  const eliminarContenido = (reporte) => {
    const que = reporte.tipo === 'proyecto' ? 'el proyecto' : 'el comentario';
    pedirConfirmacion(`¿Eliminar ${que} reportado? Esta acción no se puede deshacer.`, async () => {
      const tabla = reporte.tipo === 'proyecto' ? 'proyectos' : 'comentarios';
      const { error } = await supabase.from(tabla).delete().eq('id', reporte.objetivo_id);
      if (error) {
        avisar('Error al eliminar: ' + error.message, 'error');
        return;
      }
      await marcarReporte(reporte.id, 'revisado');
      avisar('Contenido eliminado y reporte resuelto.', 'exito');
    }, 'Eliminar contenido');
  };

  const suspender = (usuarioId, suspendido) => {
    pedirConfirmacion(
      suspendido ? '¿Suspender esta cuenta? No podrá iniciar sesión.' : '¿Reactivar esta cuenta?',
      async () => {
        const { error } = await supabase.from('perfiles')
          .update({ tipo_cuenta: suspendido ? 'suspendido' : 'standard' })
          .eq('id', usuarioId);
        if (error) {
          avisar('Error: ' + error.message, 'error');
          return;
        }
        setUsuarios((prev) => prev.map((u) =>
          u.id === usuarioId ? { ...u, tipo_cuenta: suspendido ? 'suspendido' : 'standard' } : u
        ));
        avisar(suspendido ? 'Cuenta suspendida.' : 'Cuenta reactivada.', 'exito');
      },
      suspendido ? 'Suspender cuenta' : 'Reactivar cuenta'
    );
  };

  const cambiarRol = (usuarioId, rol) => {
    pedirConfirmacion(`¿Dar rol "${rol}" a este usuario?`, async () => {
      const { error } = await supabase.from('perfiles')
        .update({ tipo_cuenta: rol }).eq('id', usuarioId);
      if (error) {
        avisar('Error: ' + error.message, 'error');
        return;
      }
      setUsuarios((prev) => prev.map((u) =>
        u.id === usuarioId ? { ...u, tipo_cuenta: rol } : u
      ));
      avisar('Rol actualizado.', 'exito');
    }, 'Cambiar rol');
  };

  const crearReto = async (e) => {
    e.preventDefault();
    if (!nuevoReto.titulo.trim()) {
      avisar('El reto necesita un título.', 'info');
      return;
    }
    const { error } = await supabase.from('retos').insert({
      titulo: nuevoReto.titulo.trim(),
      descripcion: nuevoReto.descripcion.trim() || null,
      termina_el: nuevoReto.termina_el || null,
      creado_por: miId,
    });
    if (error) {
      avisar('Error: ' + error.message, 'error');
      return;
    }
    setNuevoReto({ titulo: '', descripcion: '', termina_el: '' });
    await Promise.all([cargarRetos(), cargarStats()]);
    avisar('Reto publicado.', 'exito');
  };

  const alternarReto = async (reto) => {
    await supabase.from('retos').update({ activo: !reto.activo }).eq('id', reto.id);
    setRetos((prev) => prev.map((r) => (r.id === reto.id ? { ...r, activo: !reto.activo } : r)));
  };

  const borrarReto = (id) => {
    pedirConfirmacion('¿Eliminar este reto y sus participaciones?', async () => {
      await supabase.from('retos').delete().eq('id', id);
      await Promise.all([cargarRetos(), cargarStats()]);
    }, 'Eliminar reto');
  };

  if (cargando) return <div className="dash-pantalla"><p className="dash-cargando">Verificando acceso...</p></div>;

  if (!esAdmin) {
    return (
      <section className="dash-pantalla">
        <div className="dash-vacio">
          <ShieldAlert size={34} />
          <span>Acceso restringido: se requiere rol de administrador.</span>
          <button type="button" className="btn btn-secundario" onClick={() => navigate('/dashboard')}>
            Volver a mi perfil
          </button>
        </div>
      </section>
    );
  }

  const pendientes = reportes.filter((r) => r.estado === 'pendiente');

  return (
    <section className="dash-pantalla">
      <div className="dash-barra">
        <button type="button" className="btn btn-ghost" onClick={() => navigate('/dashboard')}>
          <ArrowLeft size={18} /> Mi perfil
        </button>
        <span className="badge marca"><ShieldAlert size={13} /> Administración</span>
      </div>

      <h2 className="dash-titulo-seccion">Panel de administración</h2>

      <div className="dash-panel">
        <div className="fila">
          <span className="dash-stat"><Users size={14} /> {stats.usuarios} usuarios</span>
          <span className="dash-stat"><BarChart3 size={14} /> {stats.proyectos} proyectos</span>
          <span className="dash-stat"><Flag size={14} /> {stats.pendientes} reportes pendientes</span>
          <span className="dash-stat"><Trophy size={14} /> {stats.retos} retos</span>
        </div>
      </div>

      <div className="tabs">
        <button type="button" className={`tab ${tab === 'reportes' ? 'activo' : ''}`} onClick={() => setTab('reportes')}>
          <Flag size={14} /> Reportes {pendientes.length > 0 && `(${pendientes.length})`}
        </button>
        <button type="button" className={`tab ${tab === 'usuarios' ? 'activo' : ''}`} onClick={() => setTab('usuarios')}>
          <Users size={14} /> Usuarios
        </button>
        <button type="button" className={`tab ${tab === 'retos' ? 'activo' : ''}`} onClick={() => setTab('retos')}>
          <Trophy size={14} /> Retos
        </button>
      </div>

      {tab === 'reportes' && (
        <div className="dash-panel">
          <h4 className="dash-panel-titulo"><Flag size={18} /> Cola de moderación</h4>
          {reportes.length === 0 ? (
            <p className="texto-3">No hay reportes.</p>
          ) : (
            <div className="columna">
              {reportes.map((r) => (
                <div key={r.id}>
                  <div className="fila-entre">
                    <div className="crecer">
                      <span className="badge marca">{r.tipo}</span>{' '}
                      <span className="badge">{r.estado}</span>
                      <p className="sin-margen texto-2"><strong>{r.motivo}</strong></p>
                      {r.detalle && <p className="sin-margen texto-3">{r.detalle}</p>}
                      <small className="texto-3">
                        {r.creado_el ? new Date(r.creado_el).toLocaleString('es-VE') : ''}
                      </small>
                    </div>
                    {r.estado === 'pendiente' && (
                      <div className="fila">
                        {r.tipo !== 'perfil' && (
                          <button type="button" className="btn-icono peligro" title="Eliminar contenido" onClick={() => eliminarContenido(r)}>
                            <Trash2 size={16} />
                          </button>
                        )}
                        {r.tipo === 'perfil' && (
                          <button type="button" className="btn-icono peligro" title="Suspender usuario" onClick={() => suspender(r.objetivo_id, true)}>
                            <Ban size={16} />
                          </button>
                        )}
                        <button type="button" className="btn-icono" title="Desestimar" onClick={() => marcarReporte(r.id, 'desestimado')}>
                          <X size={16} />
                        </button>
                        <button type="button" className="btn-icono marca" title="Marcar revisado" onClick={() => marcarReporte(r.id, 'revisado')}>
                          <Check size={16} />
                        </button>
                      </div>
                    )}
                  </div>
                  <hr className="divisor" />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'usuarios' && (
        <div className="dash-panel">
          <h4 className="dash-panel-titulo"><Users size={18} /> Usuarios</h4>
          <div className="columna">
            {usuarios.map((u) => (
              <div key={u.id}>
                <div className="fila-entre">
                  <div className="crecer">
                    <strong>{u.nombre_completo}</strong>{' '}
                    <span className="badge">{u.tipo_cuenta}</span>
                    {u.disponible_trabajo && <span className="badge marca">Disponible</span>}
                  </div>
                  {String(u.id) !== String(miId) && (
                    <div className="fila">
                      {u.tipo_cuenta !== 'admin' && (
                        <button type="button" className="btn-icono marca" title="Hacer admin" onClick={() => cambiarRol(u.id, 'admin')}>
                          <Crown size={16} />
                        </button>
                      )}
                      {u.tipo_cuenta === 'suspendido' ? (
                        <button type="button" className="btn-icono" title="Reactivar" onClick={() => suspender(u.id, false)}>
                          <Check size={16} />
                        </button>
                      ) : (
                        <button type="button" className="btn-icono peligro" title="Suspender" onClick={() => suspender(u.id, true)}>
                          <Ban size={16} />
                        </button>
                      )}
                    </div>
                  )}
                </div>
                <hr className="divisor" />
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'retos' && (
        <div className="dash-panel">
          <h4 className="dash-panel-titulo"><Trophy size={18} /> Retos creativos</h4>
          <form onSubmit={crearReto} className="columna">
            <input
              className="campo"
              placeholder="Título del reto (ej. Retrato en 48h)"
              maxLength={60}
              value={nuevoReto.titulo}
              onChange={(e) => setNuevoReto({ ...nuevoReto, titulo: e.target.value })}
            />
            <textarea
              className="campo"
              placeholder="Descripción y reglas"
              maxLength={200}
              value={nuevoReto.descripcion}
              onChange={(e) => setNuevoReto({ ...nuevoReto, descripcion: e.target.value })}
            />
            <div className="fila">
              <input
                type="date"
                className="campo"
                value={nuevoReto.termina_el}
                onChange={(e) => setNuevoReto({ ...nuevoReto, termina_el: e.target.value })}
              />
              <button type="submit" className="btn btn-primario">
                <Plus size={16} /> Publicar reto
              </button>
            </div>
          </form>
          <hr className="divisor" />
          <div className="columna">
            {retos.map((r) => (
              <div key={r.id} className="fila-entre">
                <div className="crecer">
                  <strong>{r.titulo}</strong>{' '}
                  <span className="badge">{r.activo ? 'activo' : 'cerrado'}</span>
                  {r.termina_el && <small className="texto-3"> · Cierra: {r.termina_el}</small>}
                </div>
                <div className="fila">
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => alternarReto(r)}
                  >
                    {r.activo ? 'Cerrar' : 'Reabrir'}
                  </button>
                  <button type="button" className="btn-icono peligro" title="Eliminar reto" onClick={() => borrarReto(r.id)}>
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <AlertModal alerta={alerta} setAlerta={setAlerta} />
    </section>
  );
};

export default Admin;
