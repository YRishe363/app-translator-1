const btn = document.getElementById('translateBtn');
const source = document.getElementById('source');
const target = document.getElementById('target');
const result = document.getElementById('result');
const historyList = document.getElementById('history');

btn.addEventListener('click', async () => {
    const text = source.value.trim();
    if (!text) return;

    result.textContent = 'מתרגם...';
    try {
        const res = await fetch('/api/translate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text, target: target.value })
        });
        const data = await res.json();
        
        // תיקון 1: שימוש ב-translated_text (עם קו תחתון) כפי שהבאקנד מחזיר
        result.textContent = data.translated_text; 
        
        loadHistory();
    } catch (err) {
        result.textContent = 'שגיאה: ' + err.message;
    }
});

async function loadHistory() {
    try {
        const res = await fetch('/api/history');
        if (!res.ok) throw new Error('Failed to fetch history');
        const data = await res.json();
        
        // תיקון 2: התאמה לשמות העמודות ב-PostgreSQL
        historyList.innerHTML = data.map(row => 
            `<li>${row.source_text} ➔ ${row.translated_text} (${row.target_lang})</li>`
        ).join('');
    } catch (err) {
        console.error("History error:", err);
    }
}

loadHistory();