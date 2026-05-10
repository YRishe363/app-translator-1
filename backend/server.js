import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import pkg from 'pg';
const { Pool } = pkg;


const app = express();
app.use(express.json());
app.use(cors());


const pool = new Pool({
connectionString: process.env.DATABASE_URL || 'postgres://postgres:postgres@db:5432/translations'
});


// פונקציית תרגום אמיתית דרך LibreTranslate API
async function translateText(text, target) {
try {
const res = await fetch('http://translator:5000/translate', {
method: 'POST',
headers: { 'Content-Type': 'application/json' },
body: JSON.stringify({ q: text, source: 'auto', target, format: 'text' })
});
const data = await res.json();
return data.translatedText;
} catch (err) {
console.error('Translation error:', err);
return '(שגיאה בתרגום)';
}
}


app.post('/translate', async (req, res) => {
const { text, target } = req.body;
if (!text || !target) return res.status(400).json({ error: 'Missing text or target' });


const translatedText = await translateText(text, target);
await pool.query('INSERT INTO translations (source_text, target_lang, translated_text) VALUES ($1,$2,$3)', [text, target, translatedText]);
res.json({ translatedText });
});


app.get('/history', async (req, res) => {
const r = await pool.query('SELECT source_text, translated_text FROM translations ORDER BY id DESC LIMIT 10');
res.json(r.rows);
});


app.listen(3001, () => console.log('✅ Backend running on http://localhost:3001'));