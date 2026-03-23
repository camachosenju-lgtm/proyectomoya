import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate, Link } from 'react-router-dom';
import imagenDeFondo from '../imagenes/fondo.jpg'; 
import logoProyecto from '../imagenes/logo.png'; 

// --- VALIDACIONES DE SEGURIDAD ---
const esTextoSeguro = (texto) => {
  // Bloquea patrones comunes de SQL Injection
  const ban = /('|;|--|\/\*|\*\/|\b(drop|delete|insert|update|select|truncate|alter|create)\b)/i;
  return !ban.test(texto);
};

const validarFormulario = (email, password) => {
  if (!email || !email.trim()) return 'El correo es obligatorio.';
  if (email.length > 65) return 'El correo es demasiado largo.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Formato de correo inválido.';
  if (!esTextoSeguro(email)) return 'Caracteres no permitidos en el correo.';

  if (!password || password.length < 6) return 'La contraseña debe tener al menos 6 caracteres.';
  if (password.length > 30) return 'La contraseña es demasiado larga.';
  if (!esTextoSeguro(password)) return 'Caracteres no permitidos en la contraseña.';

  return null;
};

const Registro = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [cargando, setCargando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const navigate = useNavigate();

  const manejarRegistro = async (e) => {
    e.preventDefault();
    setMensaje('');
    
    // 1. Validar inputs localmente
    const errorValidacion = validarFormulario(email, password);
    if (errorValidacion) {
      setMensaje(errorValidacion);
      return;
    }

    setCargando(true);

    try {
      // 2. Intentar registro en Supabase Auth
      // Nota: Supabase detecta automáticamente si el correo ya existe
      const { data, error: errorAuth } = await supabase.auth.signUp({
        email,
        password,
      });

      if (errorAuth) {
        // Manejo específico para correos duplicados
        if (errorAuth.message.includes('already registered') || errorAuth.status === 422) {
          setMensaje('Este correo ya está registrado. Intenta iniciar sesión.');
        } else {
          setMensaje('Error: ' + errorAuth.message);
        }
        setCargando(false);
        return;
      }

      const usuario = data.user;

      if (usuario) {
        // 3. Crear fila en la tabla 'perfiles' (para el Dashboard)
        const { error: errorPerfil } = await supabase
          .from('perfiles')
          .insert([
            { 
              id: usuario.id, 
              nombre_completo: 'Nuevo Artista', 
              biografia: 'Cuenta pendiente de verificación.',
              avatar_url: 'https://via.placeholder.com/150' 
            }
          ]);

        if (errorPerfil) console.error("Error Perfil:", errorPerfil.message);

        // 4. SEGURIDAD: Cerrar sesión automática tras registro
        // Esto obliga al usuario a verificar su email antes de entrar.
        await supabase.auth.signOut();

        setEnviado(true);
        setMensaje('¡Registro exitoso! Por seguridad, verifica tu correo electrónico para activar tu cuenta.');
        setEmail('');
        setPassword('');
      }
    } catch (error) {
      setMensaje('Error inesperado de conexión.');
      console.error(error);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div style={{...estilos.padre, ...estilos.fondoConImagen}}>
      <div style={estilos.tarjeta}>
        <div style={estilos.contenedorLogo}>
          <img src={logoProyecto} alt="Logo" style={estilos.logo} />
        </div>

        <h2 style={estilos.titulo}>Registro de Usuario</h2>
        
        {!enviado ? (
          <form onSubmit={manejarRegistro} style={estilos.form}>
            <input
              type="email"
              placeholder="Tu Gmail de Artista"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={estilos.input}
              required
              disabled={cargando}
            />
            <input
              type="password"
              placeholder="Crea tu Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={estilos.input}
              required
              disabled={cargando}
            />
            <button 
              type="submit" 
              style={cargando ? {...estilos.boton, opacity: 0.7} : estilos.boton}
              disabled={cargando}
            >
              {cargando ? 'Procesando...' : 'Crear Mi Cuenta'}
            </button>
          </form>
        ) : (
          <div style={estilos.zonaExito}>
            <p style={estilos.mensajeExito}>{mensaje}</p>
            <button onClick={() => navigate('/login')} style={estilos.botonLogin}>Ir al Login</button>
          </div>
        )}

        {!enviado && (
          <>
            {mensaje && <p style={estilos.mensajeError}>{mensaje}</p>}
            <p style={estilos.footerTexto}>
              ¿Ya eres parte? <Link to="/login" style={estilos.link}>Loguéate aquí</Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
};

// --- ESTILOS (Mantenemos tu diseño oscuro con naranja) ---
const estilos = {
  padre: { height: '100vh', width: '100vw', display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  fondoConImagen: { backgroundImage: `url(${imagenDeFondo})`, backgroundSize: 'cover', backgroundPosition: 'center' },
  tarjeta: { backgroundColor: 'rgba(10, 10, 10, 0.96)', padding: '45px 40px', borderRadius: '25px', width: '340px', boxShadow: '0 15px 40px rgba(0,0,0,0.7)', backdropFilter: 'blur(15px)', textAlign: 'center', border: '1px solid #333' },
  contenedorLogo: { marginBottom: '25px', display: 'flex', justifyContent: 'center' },
  logo: { width: '80px', height: 'auto' },
  titulo: { color: '#f07e11', marginBottom: '25px', fontSize: '22px' },
  form: { display: 'flex', flexDirection: 'column', gap: '18px' },
  input: { padding: '14px', borderRadius: '10px', border: '1px solid #444', backgroundColor: '#181818', color: '#fff', outline: 'none' },
  boton: { padding: '14px', borderRadius: '10px', border: 'none', backgroundColor: '#f07e11', color: '#000', fontWeight: 'bold', cursor: 'pointer', transition: '0.3s' },
  zonaExito: { marginTop: '20px' },
  mensajeExito: { color: '#fff', fontSize: '0.95em', lineHeight: '1.5', marginBottom: '20px' },
  mensajeError: { color: '#f07e11', marginTop: '18px', fontSize: '0.9em' },
  botonLogin: { padding: '10px 20px', borderRadius: '8px', border: '1px solid #f07e11', backgroundColor: 'transparent', color: '#f07e11', cursor: 'pointer', fontWeight: 'bold' },
  footerTexto: { color: '#888', marginTop: '20px', fontSize: '0.9em' },
  link: { color: '#f07e11', textDecoration: 'none', fontWeight: 'bold' }
};

export default Registro;