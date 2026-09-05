const VSEGPT_API_KEY = 'sk-or-vv-4ed1df7d0cc5ad2bfc3bc646367c3440b724e9d8d8b7d6dd0fb15df5e4d43dcb';

let photoData = null;
let historyData = JSON.parse(localStorage.getItem('tarotHistory') || '[]');

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
    renderHistory();
    
    document.getElementById('cameraBtn').addEventListener('click', openCamera);
    document.getElementById('galleryBtn').addEventListener('click', openGallery);
    document.getElementById('interpretBtn').addEventListener('click', getInterpretation);
});

// === Открыть камеру ===
function openCamera() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment';
    input.onchange = handlePhotoInput;
    input.click();
}

// === Открыть галерею ===
function openGallery() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = handlePhotoInput;
    input.click();
}

// === Обработка фото ===
function handlePhotoInput(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        photoData = e.target.result;
        document.getElementById('photoImg').src = photoData;
        document.getElementById('photoPreview').style.display = 'block';
    };
    reader.readAsDataURL(file);
}

// === Поиск похожих раскладов ===
function findRelatedReadings(currentQuestion) {
    if (!currentQuestion || historyData.length === 0) return [];
    
    const keywords = currentQuestion.toLowerCase().split(' ');
    const related = [];
    
    historyData.forEach((item, index) => {
        const pastQuestion = (item.question || '').toLowerCase();
        let matchScore = 0;
        
        keywords.forEach(word => {
            if (word.length > 3 && pastQuestion.includes(word)) {
                matchScore++;
            }
        });
        
        if (matchScore > 0) {
            related.push({
                index,
                question: item.question,
                interpretation: item.interpretation,
                date: item.date,
                score: matchScore
            });
        }
    });
    
    return related.sort((a, b) => b.score - a.score).slice(0, 3);
}

// === Получение толкования ===
async function getInterpretation() {
    const question = document.getElementById('questionText').value.trim();
    const btn = document.getElementById('interpretBtn');
    const loading = document.getElementById('loading');
    const result = document.getElementById('result');

    if (!question && !photoData) {
        alert('Введите вопрос или загрузите фото расклада');
        return;
    }

    btn.disabled = true;
    loading.style.display = 'block';
    result.style.display = 'none';

    try {
        const relatedReadings = findRelatedReadings(question);
        const interpretation = await getAITarotReading(question, photoData, relatedReadings);
        document.getElementById('resultText').innerHTML = marked.parse(interpretation);
        loading.style.display = 'none';
        result.style.display = 'block';
        saveToHistory(question, interpretation);
    } catch (error) {
        console.error('Ошибка толкования:', error);
        loading.style.display = 'none';
        alert('Ошибка при получении толкования. Попробуйте ещё раз.');
    }

    btn.disabled = false;
}

// === Запрос к VseGPT ===
async function getAITarotReading(question, photoData, relatedReadings = []) {
    const contextInfo = relatedReadings.length > 0 ? `
КОНТЕКСТ ПРОШЛЫХ РАСКЛАДОВ:

${relatedReadings.map((r, i) => `
Прошлый расклад ${i + 1} (${r.date}):
Вопрос: "${r.question}"
Толкование: "${r.interpretation.substring(0, 500)}..."
`).join('\n')}

Ты помнишь эти расклады. Если текущий вопрос связан с прошлыми — мягко отметь это.
` : '';

    const prompt = `Ты — близкая подруга, которая очень хорошо разбирается в Таро. Вы сидите вечером дома, пьёте чай, и она просит тебя посмотреть её расклад.

Ты говоришь с ней тепло, по-дружески, но честно. Ты не читаешь лекцию — ты делишься тем, что видишь в картах, как будто рассказываешь подруге.

Её вопрос: "${question || 'Вопрос не указан'}"

${contextInfo}

${photoData ? 'Она сделала фото расклада. Посмотри на карты внимательно.' : 'Расклада нет. Работай по воображаемому раскладу, доверься интуиции.'}

ВАЖНО: Масти только классические — КУБКИ, ЖЕЗЛЫ, МЕЧИ, ПЕНТАКЛИ.

ПРОАНАЛИЗИРУЙ ВНУТРИ СЕБЯ:

1. Почувствуй её настроение: что её волнует, чего она ждёт от этого расклада.

2. Посмотри на карты и пойми, что они говорят о её ситуации.

3. Учти, как карты связаны между собой, что усиливается, а что смягчается.

4. Сформулируй ответ так, как сказала бы подруга.

ФОРМАТ ОТВЕТА:

## 🔮 Что я вижу в раскладе
(2-3 предложения, как будто ты смотришь на карты и делишься первым впечатлением)

## 🃏 Карты

**Название карты** — что она значит для тебя
(1-2 предложения, как подруга объясняет подруге)

**Название карты** — что она значит для тебя
(1-2 предложения, как подруга объясняет подруге)

## 💫 Если собрать всё вместе
(3-4 предложения о том, как карты складываются в общую картину)

## ⚡ Если коротко
(прямой ответ на вопрос, 2-3 предложения)

## 🌿 Мой тебе совет
(что сделать, 2-3 предложения, по-дружески)

## ✨ Запомни
(одна тёплая фраза, которую хочется записать)

ТОН:
- Тёплый, доверительный, как у близких подруг
- Можно использовать «ты», «тебе», «твоя ситуация»
- Без канцелярита и пафоса
- Честно, но не пугающе
- Даже в сложных картах покажи, что всё решаемо
- Иногда можно добавлять «мне кажется», «я чувствую», «похоже, что...»

Не упоминай, что ты ИИ.
Отвечай на русском языке.`;

    const content = [];

    if (photoData) {
        content.push({
            type: 'image_url',
            image_url: {
                url: photoData
            }
        });
    }

    content.push({
        type: 'text',
        text: prompt
    });

    const response = await fetch('https://api.vsegpt.ru/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${VSEGPT_API_KEY}`
        },
        body: JSON.stringify({
            model: 'openai/gpt-4o',
            messages: [
                {
                    role: 'user',
                    content: content
                }
            ],
            max_tokens: 4000,
            temperature: 0.9
        })
    });

    if (!response.ok) {
        throw new Error(`Ошибка ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
}

// === История ===
function saveToHistory(question, interpretation) {
    historyData.unshift({
        question: question || 'Вопрос не записан',
        interpretation,
        date: new Date().toLocaleString('ru-RU')
    });
    localStorage.setItem('tarotHistory', JSON.stringify(historyData));
    renderHistory();
}

function renderHistory() {
    const historyEl = document.getElementById('history');
    if (historyData.length === 0) {
        historyEl.innerHTML = '';
        return;
    }
    
    let html = `
        <div class="history-header">
            <div class="section-label">История раскладов</div>
            <button class="clear-history-btn" onclick="clearHistory()">🗑 Очистить всё</button>
        </div>
    `;
    
    historyData.forEach((item, index) => {
        html += `
            <div class="history-item">
                <div class="history-content" onclick="showHistoryItem(${index})">
                    <div class="q">${item.question}</div>
                    <div class="date">${item.date}</div>
                </div>
                <button class="delete-btn" onclick="deleteHistoryItem(${index})">✕</button>
            </div>
        `;
    });
    
    historyEl.innerHTML = html;
}

function deleteHistoryItem(index) {
    if (confirm('Удалить этот расклад?')) {
        historyData.splice(index, 1);
        localStorage.setItem('tarotHistory', JSON.stringify(historyData));
        renderHistory();
    }
}

function clearHistory() {
    if (confirm('Удалить всю историю раскладов? Это действие нельзя отменить.')) {
        historyData = [];
        localStorage.removeItem('tarotHistory');
        renderHistory();
    }
}

function showHistoryItem(index) {
    const item = historyData[index];
    document.getElementById('resultText').innerHTML = marked.parse(item.interpretation);
    document.getElementById('result').style.display = 'block';
    document.getElementById('result').scrollIntoView({ behavior: 'smooth' });
}

// === PWA ===
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js')
            .then(() => console.log('Service Worker зарегистрирован'))
            .catch(err => console.log('Ошибка SW:', err));
    });
}
