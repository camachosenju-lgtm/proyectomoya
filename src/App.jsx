import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './componentes/login';
import Registro from './componentes/Registro';
import Dashboard from './componentes/Dashboard';
import Galeria from './componentes/Galeria';
import PerfilPublico from './componentes/perfilpublico'; // Fíjate en la 'p' minúscula
import Notificaciones from './componentes/notificaciones';
import Olvido from './componentes/olvido';
import ActualizarPassword from './componentes/actualizarpasword';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          {/* RUTA INICIAL: Redirige al login por defecto */}
          <Route path="/" element={<Navigate to="/login" />} />

          {/* RUTA DE LOGIN */}
          <Route path="/login" element={<Login />} />

          {/* RUTA DE REGISTRO */}
          <Route path="/registro" element={<Registro />} />

          {/* RUTA DEL DASHBOARD (Privado) */}
          <Route path="/dashboard" element={<Dashboard />} />

          {/* RUTA DE LA GALERÍA PÚBLICA (Tipo Instagram/Pinterest) */}
          <Route path="/galeria" element={<Galeria />} />

          {/* RUTA DE PERFIL PÚBLICO (Dinámica) */}
          {/* El :idUsuario permite que React Router capture el ID del artista */}
          <Route path="/perfil/:idUsuario" element={<PerfilPublico />} />

          {/* RUTA DE NOTIFICACIONES */}
          <Route path="/notificaciones" element={<Notificaciones />} />

          {/* RUTA OLVIDO DE CONTRASEÑA */}
          <Route path="/olvido" element={<Olvido />} />

          {/* RUTA ACTUALIZAR CONTRASEÑA */}
          <Route path="/actualizar-password" element={<ActualizarPassword />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;