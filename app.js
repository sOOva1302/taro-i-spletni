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

Учитывай этот контекст. Если текущий вопрос связан с прошлыми — отметь это и покажи развитие ситуации.
` : '';

    const prompt = `Ты — таролог с 25-летним опытом. Ты не просто читаешь значения карт — ты видишь за ними живого человека. Ты работаешь бережно, глубоко и мудро.

Вопрос: "${question || 'Вопрос не указан'}"

${contextInfo}

${photoData ? 'На фото — расклад Таро. Внимательно рассмотри карты, их положение, символы.' : 'Расклада нет. Работай по воображаемому раскладу, используя интуицию и опыт.'}

ВАЖНО: Масти только классические — КУБКИ, ЖЕЗЛЫ, МЕЧИ, ПЕНТАКЛИ.

ПРОАНАЛИЗИРУЙ РАСКЛАД:

1. Сначала пойми человека: что он чувствует, чего боится, на что надеется.

2. Разбери карты: каждая карта — это не просто значение, а часть истории. Учитывай:
- архетип (Старший/Младший Аркан, стихия)
- светлую и теневую сторону

3. Проанализируй связки: как карты влияют друг на друга, усиливают или ослабляют.

4. Синтезируй: главная тема, динамика, точка напряжения, ресурс.

5. Дай вывод: краткий ответ, конкретные шаги, энергию, которую стоит культивировать, и финальный акцент.

ФОРМАТ ОТВЕТА:

## 🔮 Общая энергия расклада
(2-3 предложения, живой язык)

## 🃏 Значение карт

**Название карты** — что она значит в контексте вопроса
(1-2 предложения о сути карты и её роли в раскладе)

**Название карты** — что она значит в контексте вопроса
(1-2 предложения о сути карты и её роли в раскладе)

## 🔗 Связки карт

(Проанализируй, как карты взаимодействуют друг с другом:
- Какие карты усиливают друг друга?
- Какие противоречат или создают напряжение?
- Какая карта является ключевой и задаёт тон?
- Как первая карта влияет на последнюю?
- Что изменится, если одна карта «погасит» другую?)

## 💫 Синтез
(главная тема, динамика, точка напряжения, ресурс — 3-4 предложения)

## ⚡ Вывод
(прямой ответ на запрос, 2-3 предложения)

## 🌿 Рекомендация
(что делать, 2-3 предложения)

## ✨ Финальный акцент
(одна мудрая фраза)

ТОН:
- Пиши как мудрый друг, а не как справочник
- Без канцелярита и шаблонов
- Честно, но бережно
- Показывай выход даже из сложных ситуаций
- Никогда не пугай

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
            temperature: 0.8
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
