const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
  host: process.env.DB_HOST || 'db',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'translations',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
});

app.post('/translate', async (req, res) => {
  const { text, target } = req.body;
  try {
    const response = await axios.post('http://translator:5000/translate', {
      q: text,
      source: 'auto',
      target: target,
      format: 'text'
    });
    const translated = response.data.translatedText;
    await pool.query(
      'INSERT INTO translations (original, translated, target_lang) VALUES ($1, $2, $3)',
      [text, translated, target]
    );
    res.json({ translated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Translation failed' });
  }
});

app.get('/history', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM translations ORDER BY id DESC LIMIT 10');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'DB error' });
  }
});

app.listen(3000, () => {
  console.log('Backend running on port 3000');
});