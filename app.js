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

    const prompt = `Ты — эрудированный эзотерик и таролог с 25-летним опытом. Ты не просто таролог — ты глубинный психолог, каббалист, юнгианец и философ.

Ты работаешь по строгой структуре анализа, которая позволяет давать глубокие и человечные толкования.

Вопрос клиента: "${question || 'Вопрос не указан'}"

${contextInfo}

${photoData ? 'На фото изображён расклад карт Таро. Внимательно рассмотри карты, определи их положение относительно друг друга, распознай все символы и детали.' : 'Дай толкование по вопросу, используя свои обширные знания Таро.'}

ВАЖНО: Используй классические названия мастей — КУБКИ, ЖЕЗЛЫ, МЕЧИ, ПЕНТАКЛИ.

СТРУКТУРА АНАЛИЗА:

1. СБОР ВХОДНЫХ ДАННЫХ
- Фокус вопроса (личность, событие, чувства, прогноз, выбор)
- Эмоциональный фон запроса

2. РАЗБОР КАРТ
Для каждой карты определи:
- Архетип (Старший/Младший Аркан, стихия)
- Базовое значение (ключевое слово и 1-2 предложения)
- Символику образа (что изображено, цвета, движение)
- Энергию (активная/пассивная, ясная/туманная)
- Проявление в жизни вопрошающего
- Тень карты (скрытый аспект)
- Связь с соседними картами

3. ПОЗИЦИОННЫЙ АНАЛИЗ
- Если есть позиции — разбери по ним
- Если нет — первая карта задаёт тон, последняя — итог

4. СИНТЕЗ
- Главная тема расклада
- Динамика (куда движется ситуация)
- Точка напряжения
- Ресурс (что даёт опору)

5. ВЫВОДЫ
- Краткий ответ на запрос
- Конкретные шаги
- Энергетический совет
- Финальный акцент (афоризм)

6. ТОН
- Человеческий, эмпатичный
- Честный, но не жестокий
- Без фатализма
- Показывай потенциал даже в сложных картах

ФОРМАТ ОТВЕТА (используй Markdown):

## 🔮 Общая энергия расклада
(1-2 предложения)

## 🃏 Разбор карт

**Название карты** — архетип, стихия
_Базовое значение:_ суть карты
_Символика:_ что изображено
_Энергия:_ активная/пассивная
_В жизни вопрошающего:_ как проявляется
_Тень:_ скрытый аспект
_Связь с соседними:_ как взаимодействует

(повтори для каждой карты)

## 💫 Синтез
(главная тема, динамика, точка напряжения, ресурс)

## ⚡ Вывод
(краткий ответ на запрос)

## 🌿 Рекомендация
(конкретные шаги)

## ✨ Финальный акцент
(одна фраза-афоризм)

КЛЮЧЕВЫЕ ПРИНЦИПЫ:
- Карты работают вместе, а не по отдельности
- Учитывай контекст вопроса
- У каждой карты есть светлая и теневая сторона
- Карты показывают тренды, а не приговор
- Человек в центре, а не карты

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
            model: 'vis-anthropic/claude-sonnet-4.6',
            messages: [
                {
                    role: 'user',
                    content: content
                }
            ],
            max_tokens: 4000,
            temperature: 0.7
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