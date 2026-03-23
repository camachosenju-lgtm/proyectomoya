// validaciones.js

/**
 * Valida los datos del perfil del usuario (Nombre y Bio)
 */
export const validarPerfil = (perfil) => {
  const errores = {};

  // Validación de Nombre
  if (!perfil.nombre || !perfil.nombre.trim()) {
    errores.nombre = "El nombre no puede estar vacío";
  } else if (perfil.nombre.length > 25) {
    errores.nombre = "El nombre es muy largo (máximo 25 caracteres)";
  }

  // Validación de Biografía
  // Permitimos hasta 150 caracteres para que tengan espacio de escribir un párrafo
  if (perfil.bio.length > 150) {
    errores.bio = "La biografía no puede exceder los 150 caracteres";
  }

  return {
    valido: Object.keys(errores).length === 0,
    errores
  };
};

/**
 * Valida la creación de un nuevo proyecto
 */
export const validarProyecto = (proyecto) => {
  const errores = {};

  // Validación de Título (Máximo 20 caracteres como pediste)
  if (!proyecto.titulo || !proyecto.titulo.trim()) {
    errores.titulo = "El proyecto necesita un título";
  } else if (proyecto.titulo.length > 20) {
    errores.titulo = "El título es demasiado largo (máximo 20 caracteres)";
  }

  // Validación de Archivo
  if (!proyecto.imagenUrl) {
    errores.archivo = "Debes subir una imagen o video antes de publicar";
  }

  return {
    valido: Object.keys(errores).length === 0,
    errores
  };
};

/**
 * Traduce los errores estándar provistos por la plataforma de Supabase Auth
 */
export const traducirErrorSupabase = (mensaje) => {
  const diccionario = {
    "Invalid login credentials": "Tu correo o contraseña son incorrectos.",
    "User not found": "No identificamos ningún usuario con estos datos.",
    "Please enter a valid email address": "El correo ingresado no tiene un formato válido.",
    "Please enter an email address": "Por favor, escribe un correo electrónico.",
    "Password should be at least 6 characters": "La contraseña debe tener al menos 6 caracteres por seguridad.",
    "User already registered": "Este correo ya está registrado en nuestra plataforma."
  };
  
  // Si encontramos la traducción la retornamos, de lo contrario mostramos el original
  return diccionario[mensaje] || mensaje;
};