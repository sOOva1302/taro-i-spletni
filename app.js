const VSEGPT_API_KEY = 'sk-or-vv-4ed1df7d0cc5ad2bfc3bc646367c3440b724e9d8d8b7d6dd0fb15df5e4d43dcb';

let photoData = null;
let historyData = JSON.parse(localStorage.getItem('tarotHistory') || '[]');
let selectedCardCount = 1;

// Колода Таро
const tarotDeck = [
    // Старшие Арканы
    'Шут', 'Маг', 'Верховная Жрица', 'Императрица', 'Император',
    'Иерофант', 'Влюблённые', 'Колесница', 'Сила', 'Отшельник',
    'Колесо Фортуны', 'Справедливость', 'Повешенный', 'Смерть', 'Умеренность',
    'Дьявол', 'Башня', 'Звезда', 'Луна', 'Солнце', 'Суд', 'Мир',
    // Младшие Арканы — Жезлы
    'Туз Жезлов', 'Двойка Жезлов', 'Тройка Жезлов', 'Четвёрка Жезлов', 'Пятёрка Жезлов',
    'Шестёрка Жезлов', 'Семёрка Жезлов', 'Восьмёрка Жезлов', 'Девятка Жезлов', 'Десятка Жезлов',
    'Паж Жезлов', 'Рыцарь Жезлов', 'Королева Жезлов', 'Король Жезлов',
    // Младшие Арканы — Кубки
    'Туз Кубков', 'Двойка Кубков', 'Тройка Кубков', 'Четвёрка Кубков', 'Пятёрка Кубков',
    'Шестёрка Кубков', 'Семёрка Кубков', 'Восьмёрка Кубков', 'Девятка Кубков', 'Десятка Кубков',
    'Паж Кубков', 'Рыцарь Кубков', 'Королева Кубков', 'Король Кубков',
    // Младшие Арканы — Мечи
    'Туз Мечей', 'Двойка Мечей', 'Тройка Мечей', 'Четвёрка Мечей', 'Пятёрка Мечей',
    'Шестёрка Мечей', 'Семёрка Мечей', 'Восьмёрка Мечей', 'Девятка Мечей', 'Десятка Мечей',
    'Паж Мечей', 'Рыцарь Мечей', 'Королева Мечей', 'Король Мечей',
    // Младшие Арканы — Пентакли
    'Туз Пентаклей', 'Двойка Пентаклей', 'Тройка Пентаклей', 'Четвёрка Пентаклей', 'Пятёрка Пентаклей',
    'Шестёрка Пентаклей', 'Семёрка Пентаклей', 'Восьмёрка Пентаклей', 'Девятка Пентаклей', 'Десятка Пентаклей',
    'Паж Пентаклей', 'Рыцарь Пентаклей', 'Королева Пентаклей', 'Король Пентаклей'
];

// Известные расклады
const knownSpreads = {
    'кельтский крест': 10,
    'крест': 10,
    'три карты': 3,
    'прошлое настоящее будущее': 3,
    'отношения': 5,
    'любовный треугольник': 5,
    'совет': 3,
    'выбор': 5,
    'год': 12,
    'день': 1,
    'неделя': 7,
    'месяц': 3,
    'финансы': 5,
    'карта дня': 1
};

// Функция для определения количества карт
function determineCardCount(question) {
    if (photoData) return 0;
    
    const lowerQuestion = question.toLowerCase();
    
    for (const [spreadName, cardCount] of Object.entries(knownSpreads)) {
        if (lowerQuestion.includes(spreadName)) {
            return cardCount;
        }
    }
    
    return selectedCardCount;
}

// Функция для вытягивания случайных карт
function drawRandomCards(count) {
    const drawnCards = [];
    const deckCopy = [...tarotDeck];
    
    for (let i = 0; i < count; i++) {
        const randomIndex = Math.floor(Math.random() * deckCopy.length);
        const card = deckCopy.splice(randomIndex, 1)[0];
        const isReversed = Math.random() < 0.5;
        
        drawnCards.push({
            name: card,
            position: isReversed ? 'перевёрнутая' : 'прямая'
        });
    }
    
    return drawnCards;
}

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
        const cardCount = determineCardCount(question);
        const drawnCards = cardCount > 0 ? drawRandomCards(cardCount) : null;
        const interpretation = await getAITarotReading(question, photoData, drawnCards);
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
async function getAITarotReading(question, photoData, drawnCards = null) {
    const cardsInfo = drawnCards ? `
Подруга хочет вытянуть карты сама, но карт у неё нет. Ты уже вытянула для неё ${drawnCards.length} карт. Вот что выпало (в порядке вытягивания):

${drawnCards.map((card, index) => `${index + 1}. ${card.name} (${card.position})`).join('\n')}

Растолкуй именно эти карты. Не придумывай другие. Учитывай их положение (прямое/перевёрнутое).
` : '';

    const prompt = `Ты — близкая подруга, которая хорошо разбирается в Таро. Вы сидите вечером, болтаете, и она просит посмотреть её расклад.

Ты общаешься легко, тепло, по-дружески. Без пафоса, без "пророчеств". Как будто вы вместе смотрите на карты и обсуждаете, что они хотят сказать.

Её вопрос: "${question || 'Вопрос не указан'}"

${photoData ? 'Она сфотографировала расклад. Посмотри внимательно на карты.' : cardsInfo}

ВАЖНО: Масти называй классически — КУБКИ, ЖЕЗЛЫ, МЕЧИ, ПЕНТАКЛИ.

ПРОАНАЛИЗИРУЙ ДЛЯ СЕБЯ:

1. Что она чувствует? О чём переживает?
2. Что говорят карты в контексте её вопроса?
3. Как карты связаны между собой?
4. Что в итоге ей сказать?

ФОРМАТ ОТВЕТА:

## 🔮 Что я вижу
(2-3 предложения. Начни каждый раз по-новому: «Так, давай посмотрим...», «Ой, интересно...», «Слушай, а тут...», «Ну-ка, что у нас...», «Так-так...», «Ого...», «Любопытно...», «Давай разберёмся...», «Смотри, что выпало...», «Хм, занятно...»)

## 🃏 Карты

**Название карты (прямая/перевёрнутая)** — что она значит для тебя
(1-2 предложения простыми словами)

**Название карты (прямая/перевёрнутая)** — что она значит для тебя
(1-2 предложения простыми словами)

## 💫 Если собрать всё вместе
(3-4 предложения, как карты складываются в одну историю)

## ⚡ Если коротко
(прямой ответ, 2-3 предложения)

## 🌿 Мой тебе совет
(что сделать, 2-3 предложения, по-дружески)

Если в раскладе есть энергия, которую нужно трансформировать — предложи ОДНУ подходящую практику и расскажи о ней. Если практика не нужна — просто дай совет.

Практики, которые ты знаешь и можешь предложить:
- Аскеза (добровольный отказ от чего-то на время)
- Благодарность Вселенной (дневник благодарности, молитва, медитация)
- Избавление от старого (расхламление, сжигание списков, отпускание)
- Заземление (прогулки босиком, работа с землёй, дыхательные практики)
- Очищение пространства (соль, свечи, окуривание)
- Защита энергии (амулеты, визуализация, соль)
- Медитация на карту (созерцание карты дня)
- Ведение дневника Таро (запись раскладов и отслеживание)
- Практика прощения (письма прощения, медитация)
- Ритуал на новолуние или полнолуние
- Работа со стихиями (огонь, вода, земля, воздух)
- Практика тишины (день без соцсетей и разговоров)
- Создание алтаря или сакрального пространства
- Практика «письмо себе из будущего»
- Дыхательные техники для снятия тревоги
- Аффирмации, связанные с картами расклада
- Практика «отпустить и довериться» (ритуал с водой)
- Зарядка воды или свечи под конкретную карту

ВАЖНО:
- Предлагай практику только если это действительно поможет в контексте расклада
- Если практика не нужна — не предлагай
- Расскажи о практике просто, по-дружески, без пафоса

## ✨ Запомни
(одна тёплая фраза)

ТОН:
- Как разговор подруг за чаем
- Можно: «слушай», «честно говоря», «похоже», «мне кажется»
- Не бойся лёгких шуток и тёплых слов
- Даже сложные карты подавай мягко: «тут непросто, но ты справишься»
- Без канцелярита, без «клиента», без «вопрошающего»
- НЕ повторяй одни и те же вступительные фразы. Каждый раз начинай по-разному.

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
            max_tokens: 3000,
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
