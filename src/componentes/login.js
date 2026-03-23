import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom'; // 1. Importamos el "volante"
import imagenDeFondo from '../imagenes/fondo.jpg'; 
import logoPocketwork from '../imagenes/logo.png'; 

const Login = () => {
  const [datos, setDatos] = useState({ correo: '', clave: '' });
  const [cargando, setCargando] = useState(false);
  const navigate = useNavigate(); // 2. Inicializamos el hook de navegación

  const banSQL = /('|;|--|\/\*|\*\/|\b(drop|delete|insert|update|select|truncate|alter|create)\b)/i;

  const validarLogin = (email, password) => {
    if (!email || !email.trim()) return 'El correo es obligatorio.';
    if (email.length > 65) return 'El correo no puede tener más de 65 caracteres.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Formato de correo inválido.';
    if (banSQL.test(email)) return 'El correo contiene caracteres inválidos.';

    if (!password || !password.trim()) return 'La contraseña es obligatoria.';
    if (password.length > 30) return 'La contraseña no puede tener más de 30 caracteres.';
    if (banSQL.test(password)) return 'La contraseña contiene caracteres inválidos.';

    return null;
  };

  const manejarCambio = (e) => {
    setDatos({ ...datos, [e.target.name]: e.target.value });
  };

  const enviarFormulario = async (e) => {
    e.preventDefault();

    const errorValidar = validarLogin(datos.correo, datos.clave);
    if (errorValidar) {
      alert(errorValidar);
      return;
    }

    setCargando(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email: datos.correo,
      password: datos.clave,
    });

    if (error) {
      alert("Error: " + error.message);
    } else {
      console.log("Usuario logueado:", data.user);
      // 3. Navegamos directamente a la ruta que definimos en App.js
      navigate('/dashboard'); 
    }
    setCargando(false);
  };

  return (
    <div style={{...estilos.padre, ...estilos.fondoConImagen}}>
      <form onSubmit={enviarFormulario} style={estilos.formulario}>
        
        <div style={estilos.cabecera}>
          <img src={logoPocketwork} alt="Logo" style={estilos.logo} />
          <h2 style={estilos.titulo}>Pocketwork</h2>
        </div>
        
        <input
          name="correo"
          type="email"
          placeholder="Tu correo"
          onChange={manejarCambio}
          style={estilos.input}
          required
        />

        <input
          name="clave"
          type="password"
          placeholder="Tu contraseña"
          onChange={manejarCambio}
          style={estilos.input}
          required
        />

        <button type="submit" style={estilos.boton} disabled={cargando}>
          {cargando ? 'Entrando...' : 'Entrar al Perfil'}
        </button>

        <div style={estilos.contenedorLinks}>
          <a href="#" style={estilos.link} onClick={() => navigate('/olvido')}>
            ¿Olvidaste tu contraseña?
          </a>
          <div style={estilos.divisor}></div>
          <a href="#" style={estilos.linkSecundario} onClick={() => navigate('/registro')}>
            Crear una cuenta
          </a>
        </div>
      </form>

      <div style={estilos.contenedorAcercaDe}>
        <a href="#!" style={estilos.botonAcercaDe}>Acerca de Nosotros</a>
      </div>
    </div>
  );
};

// ... los estilos se mantienen exactamente igual ...
const estilos = {
  padre: { height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative' },
  fondoConImagen: { backgroundImage: `url(${imagenDeFondo})`, backgroundSize: 'cover', backgroundPosition: 'center' },
  formulario: { backgroundColor: 'rgba(15, 15, 15, 0.92)', padding: '30px 40px', borderRadius: '20px', display: 'flex', flexDirection: 'column', width: '350px', boxShadow: '0 10px 40px rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' },
  cabecera: { display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '25px' },
  logo: { width: '180px', height: 'auto', marginBottom: '-15px', filter: 'drop-shadow(0 0 10px rgba(240, 126, 17, 0.3))' },
  titulo: { color: '#f07e11', fontSize: '32px', fontWeight: 'bold', margin: '0', letterSpacing: '2px', textTransform: 'uppercase' },
  input: { marginBottom: '15px', padding: '14px', fontSize: '16px', borderRadius: '10px', border: '1px solid #444', backgroundColor: '#222', color: '#eee', outline: 'none' },
  boton: { padding: '14px', backgroundColor: '#f07e11', color: '#000', border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: '18px', fontWeight: 'bold' },
  contenedorLinks: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' },
  link: { color: '#888', textDecoration: 'none', fontSize: '14px', cursor: 'pointer' },
  linkSecundario: { color: '#f07e11', textDecoration: 'none', fontSize: '14px', cursor: 'pointer' },
  divisor: { height: '1px', backgroundColor: '#333', width: '100%' },
  contenedorAcercaDe: { position: 'absolute', bottom: '20px', right: '20px' },
  botonAcercaDe: { color: '#888', textDecoration: 'none', fontSize: '13px', border: '1px solid #444', padding: '5px 15px', borderRadius: '15px' }
};

export default Login;