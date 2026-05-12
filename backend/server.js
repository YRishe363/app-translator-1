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

// פונקציית תרגום מעודכנת שמחזירה גם את השפה שזוהתה
async function translateText(text, target) {
    try {
        const res = await fetch('http://translator:5000/translate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ q: text, source: 'auto', target, format: 'text' })
        });
        const data = await res.json();
        
        return {
            translatedText: data.translatedText,
            sourceLang: data.detectedLanguage ? data.detectedLanguage.language : 'unknown'
        };
    } catch (err) {
        console.error('Translation error:', err);
        return { translatedText: '(שגיאה בתרגום)', sourceLang: '?' };
    }
}

app.post('/api/translate', async (req, res) => {
    const { text, target } = req.body;
    if (!text || !target) return res.status(400).json({ error: 'Missing text or target' });

    const { translatedText, sourceLang } = await translateText(text, target);
    
    try {
        // שמירת כל השדות כולל שפת המקור שזוהתה
        await pool.query(
            'INSERT INTO translations (source_text, translated_text, source_lang, target_lang) VALUES ($1, $2, $3, $4)', 
            [text, translatedText, sourceLang, target]
        );
        res.json({ translatedText, source_lang: sourceLang });
    } catch (dbErr) {
        console.error('Database INSERT error:', dbErr);
        res.status(500).json({ error: 'Failed to save translation' });
    }
});

app.get('/api/history', async (req, res) => {
    try {
        // שליפת כל השדות הרלוונטיים להצגה
        const r = await pool.query('SELECT source_text, translated_text, source_lang, target_lang FROM translations ORDER BY id DESC LIMIT 10');
        res.json(r.rows);
    } catch (err) {
        console.error('Database SELECT error:', err);
        res.status(500).json({ error: "Database error" });
    }
});

const PORT = 3001;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Backend running on port ${PORT} (listening on all interfaces)`);
});