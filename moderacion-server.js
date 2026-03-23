const express = require('express');
const fetch = require('node-fetch');
const multer = require('multer');
const FormData = require('form-data');
const cors = require('cors');

const API_USER = '1456486769';
const API_SECRET = 'MWZsLSybLfuit6bzsDYF6edBEUZXhhsm';

const app = express();
const upload = multer();

app.use(cors());
app.use(express.json());

// Validar texto
app.post('/api/moderar-texto', async (req, res) => {
  const { texto } = req.body;
  const params = new URLSearchParams({
    text: texto,
    lang: 'es',
    mode: 'standard',
    api_user: API_USER,
    api_secret: API_SECRET
  });

  try {
    const response = await fetch(`https://api.sightengine.com/1.0/check-text.json?${params}`);
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Error al conectar con Sightengine', detalle: err.message });
  }
});

// Validar video (subida directa)
app.post('/api/moderar-video', upload.single('video'), async (req, res) => {
  const form = new FormData();
  form.append('media', req.file.buffer, { filename: req.file.originalname });
  form.append('models', 'nudity-2.0');
  form.append('api_user', API_USER);
  form.append('api_secret', API_SECRET);

  try {
    const response = await fetch('https://api.sightengine.com/1.0/video/check.json', {
      method: 'POST',
      body: form
    });
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Error al conectar con Sightengine', detalle: err.message });
  }
});

const PORT = 4000;
app.listen(PORT, () => {
  console.log(`Servidor de moderación corriendo en http://localhost:${PORT}`);
});