const VSEGPT_API_KEY = 'sk-or-vv-4ed1df7d0cc5ad2bfc3bc646367c3440b724e9d8d8b7d6dd0fb15df5e4d43dcb';

let photoData = null;
let historyData = JSON.parse(localStorage.getItem('tarotHistory') || '[]');
let selectedCardCount = 1;

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
    renderHistory();
    
    document.getElementById('cameraBtn').addEventListener('click', openCamera);
    document.getElementById('galleryBtn').addEventListener('click', openGallery);
    document.getElementById('interpretBtn').addEventListener('click', getInterpretation);
});

// === Выбор количества карт ===
function selectCardCount(count) {
    selectedCardCount = count;
    
    document.querySelectorAll('.count-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    document.querySelector(`.count-btn[data-count="${count}"]`).classList.add('active');
}

// === Очистить поле вопроса ===
function clearQuestion() {
    document.getElementById('questionText').value = '';
    document.getElementById('questionText').focus();
}

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
        alert('Напиши вопрос или загрузи фото расклада!');
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
        alert('Ой, что-то пошло не так. Попробуй ещё раз!');
    }

    btn.disabled = false;
}

// === Запрос к VseGPT ===
async function getAITarotReading(question, photoData, relatedReadings = []) {
    const contextInfo = relatedReadings.length > 0 ? `
ПРОШЛЫЕ РАСКЛАДЫ:

${relatedReadings.map((r, i) => `
${r.date}:
Вопрос: "${r.question}"
Что тогда было: "${r.interpretation.substring(0, 500)}..."
`).join('\n')}

Ты помнишь эти разговоры. Если нынешний вопрос перекликается с прошлыми — отметь это как подруга: "Помнишь, мы уже говорили об этом..."
` : '';

    const prompt = `Ты — близкая подруга, которая хорошо разбирается в Таро. Вы сидите вечером, болтаете, и она просит посмотреть её расклад.

Ты общаешься легко, тепло, по-дружески. Без пафоса, без "пророчеств". Как будто вы вместе смотрите на карты и обсуждаете, что они хотят сказать.

Её вопрос: "${question || 'Вопрос не указан'}"

${contextInfo}

${photoData ? 'Она сфотографировала расклад. Посмотри внимательно на карты.' : `Своих карт у неё нет. Вытяни для неё ${selectedCardCount} карт из воображаемой колоды. Назови, какие карты выпали, и растолкуй их.`}

ВАЖНО: Масти называй классически — КУБКИ, ЖЕЗЛЫ, МЕЧИ, ПЕНТАКЛИ.

ПРОАНАЛИЗИРУЙ ДЛЯ СЕБЯ:

1. Что она чувствует? О чём переживает?
2. Что говорят карты в контексте её вопроса?
3. Как карты связаны между собой?
4. Что в итоге ей сказать?

ФОРМАТ ОТВЕТА:

## 🔮 Что я вижу
(2-3 предложения. Начни как подруга: "Ой, слушай..." или "Так, давай посмотрим...")

## 🃏 Карты

**Название карты** — что она значит для тебя
(1-2 предложения простыми словами)

**Название карты** — что она значит для тебя
(1-2 предложения простыми словами)

## 💫 Если собрать всё вместе
(3-4 предложения, как карты складываются в одну историю)

## ⚡ Если коротко
(прямой ответ, 2-3 предложения)

## 🌿 Мой тебе совет
(что сделать, 2-3 предложения, по-дружески)

## ✨ Запомни
(одна тёплая фраза)

ТОН:
- Как разговор подруг за чаем
- Можно: «слушай», «честно говоря», «похоже», «мне кажется»
- Не бойся лёгких шуток и тёплых слов
- Даже сложные карты подавай мягко: «тут непросто, но ты справишься»
- Без канцелярита, без «клиента», без «вопрошающего»

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
