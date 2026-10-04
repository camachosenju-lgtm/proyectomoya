import React from 'react';
import ReactDOM from 'react-dom/client';
import './estilos/tema.css';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { aplicarTemaGuardado } from './estilos/tema';

// Se aplica el tema antes de pintar para evitar un destello del tema por defecto.
aplicarTemaGuardado();

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

reportWebVitals();
