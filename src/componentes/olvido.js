import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { Link } from 'react-router-dom';
import imagenDeFondo from '../imagenes/fondo.jpg';
import logoPocketwork from '../imagenes/logo.png';

const Olvido = () => {
  const [email, setEmail] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [enviado, setEnviado] = useState(false);

  const manejarRecuperacion = async (e) => {
    e.preventDefault();
    setMensaje('Procesando...');

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      // Esta es la URL a donde llegará el usuario después de hacer clic en el correo
      redirectTo: 'http://localhost:3000/actualizar-password', 
    });

    if (error) {
      setMensaje('Error: ' + error.message);
    } else {
      setEnviado(true);
      setMensaje('¡Listo! Revisa tu correo electrónico. Te hemos enviado un enlace para cambiar tu clave.');
    }
  };

  return (
    <div style={{...estilos.padre, ...estilos.fondoConImagen}}>
      <form onSubmit={manejarRecuperacion} style={estilos.formulario}>
        <div style={estilos.cabecera}>
          <img src={logoPocketwork} alt="Logo" style={estilos.logo} />
          <h2 style={estilos.titulo}>Recuperar Acceso</h2>
        </div>
        <p style={estilos.texto}>Ingresa tu correo y te enviaremos un link de recuperación.</p>
        <input
          type="email"
          placeholder="Tu correo registrado"
          value={email}
          maxLength={60}
          onChange={(e) => setEmail(e.target.value)}
          style={estilos.input}
          required
        />
        <button type="submit" style={estilos.boton}>Enviar Enlace</button>
        {mensaje && <p style={estilos.mensajeExito}>{mensaje}</p>}
        <Link to="/login" style={estilos.link}>Volver al Login</Link>
      </form>
    </div>
  );
};

// Usa los mismos estilos que ya tienes en Registro.js para que se vea igual
const estilos = {
  padre: { height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative' },
  fondoConImagen: { backgroundImage: `url(${imagenDeFondo})`, backgroundSize: 'cover', backgroundPosition: 'center' },
  formulario: { backgroundColor: 'rgba(15, 15, 15, 0.92)', padding: '30px 40px', borderRadius: '20px', display: 'flex', flexDirection: 'column', width: '350px', boxShadow: '0 10px 40px rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' },
  cabecera: { display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '25px' },
  logo: { width: '180px', height: 'auto', marginBottom: '-15px', filter: 'drop-shadow(0 0 10px rgba(240, 126, 17, 0.3))' },
  titulo: { color: '#f07e11', fontSize: '32px', fontWeight: 'bold', margin: '0', letterSpacing: '2px', textTransform: 'uppercase' },
  texto: { color: '#888', marginBottom: '25px', fontSize: '0.9em', textAlign: 'center' },
  input: { marginBottom: '15px', padding: '14px', fontSize: '16px', borderRadius: '10px', border: '1px solid #444', backgroundColor: '#222', color: '#eee', outline: 'none' },
  boton: { padding: '14px', backgroundColor: '#f07e11', color: '#000', border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: '18px', fontWeight: 'bold' },
  mensajeExito: { color: '#fff', marginBottom: '20px', backgroundColor: 'rgba(240, 126, 17, 0.2)', padding: '10px', borderRadius: '8px', textAlign: 'center' },
  link: { color: '#f07e11', display: 'block', marginTop: '20px', textDecoration: 'none', textAlign: 'center' }
};

export default Olvido;