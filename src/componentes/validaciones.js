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