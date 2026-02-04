// script.js
// Fetch periodic table data from a public JSON source
const DATA_URL = 'https://raw.githubusercontent.com/Bowserinator/Periodic-Table-JSON/master/PeriodicTableJSON.json';
// API key for Gemini AI (Updated per user request)
const GEMINI_API_KEY = 'AIzaSyDdoattvDdGI0cvGHJ3PCXj912HbRrXcDI';

let elements = [];
let darkMode = false;

// Utility: convert hex to RGB array
function hexToRgb(hex) {
    const clean = hex.replace('#', '');
    const bigint = parseInt(clean, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return [r, g, b];
}
// Utility: invert a hex color (simple opposite)
function invertHex(hex) {
    const [r, g, b] = hexToRgb(hex);
    const ir = 255 - r;
    const ig = 255 - g;
    const ib = 255 - b;
    return `#${((1 << 24) + (ir << 16) + (ig << 8) + ib).toString(16).slice(1)}`;
}

// Load data and initialise UI
async function init() {
    try {
        const resp = await fetch(DATA_URL);
        const data = await resp.json();
        elements = data.elements;
        console.log('Loaded', elements.length, 'elements');
        buildTable();
        attachControls();
    } catch (err) {
        console.error('Failed to load element data:', err);
    }
}

// buildTable creates tiles positioned by gridColumn and gridRow
function buildTable() {
    const table = document.getElementById('periodicTable');
    if (!table) return;
    table.innerHTML = '';
    elements.forEach(el => {
        const div = document.createElement('div');
        div.className = 'tile';
        div.dataset.symbol = el.symbol;
        // CSS grid placement (1-based)
        div.style.gridColumn = el.xpos;
        div.style.gridRow = el.ypos;
        div.innerHTML = `
            <div class="number">${el.number}</div>
            <div class="symbol">${el.symbol}</div>
            <div class="name">${el.name}</div>
        `;
        const category = el.category ? el.category.toString() : '';
        const colourMap = {
            'alkali metal': '#ef4444',
            'alkaline earth metal': '#f59e0b',
            'transition metal': '#f87171',
            'post-transition metal': '#10b981',
            'metalloid': '#3b82f6',
            'diatomic nonmetal': '#8b5cf6',
            'polyatomic nonmetal': '#a855f7',
            'halogen': '#06b6d4',
            'noble gas': '#ec4899',
            'lanthanide': '#fb923c',
            'actinide': '#f472b6',
            'unknown, probably transition metal': '#94a3b8',
            'unknown, probably post-transition metal': '#94a3b8',
            'unknown, probably metalloid': '#94a3b8',
            'unknown, predicted to be noble gas': '#94a3b8',
            'unknown, but predicted to be an alkali metal': '#94a3b8'
        };
        const defaultCol = category && colourMap[category.toLowerCase()] ? colourMap[category.toLowerCase()] : '#94a3b8';
        div.style.backgroundColor = defaultCol;

        // Dynamic Contrast Logic
        const [r, g, b] = hexToRgb(defaultCol);
        const brightness = (r * 299 + g * 587 + b * 114) / 1000;
        div.style.color = brightness > 128 ? '#0f172a' : '#ffffff';

        // Optimized staggered animation delay (max 1.5s total)
        const delay = Math.min(el.number * 0.015, 1.5);
        div.style.animationDelay = `${delay}s`;
        div.addEventListener('click', () => {
            document.getElementById('clickSound').play();
            showDetails(el);
        });
        table.appendChild(div);
    });
    console.log('Table built');
}

function attachControls() {
    const colorSelect = document.getElementById('colorSelect');
    colorSelect.addEventListener('change', e => {
        const colour = e.target.value;
        const inverted = invertHex(colour);
        document.body.style.backgroundColor = darkMode ? inverted : colour;
    });

    const darkBtn = document.getElementById('darkModeBtn');
    darkBtn.addEventListener('click', () => {
        darkMode = !darkMode;
        document.body.classList.toggle('dark', darkMode);
        // Toggle background based on the current selection
        const currentSelection = colorSelect.value;
        const inverted = invertHex(currentSelection);
        document.body.style.backgroundColor = darkMode ? inverted : currentSelection;
        darkBtn.textContent = darkMode ? 'Light Mode' : 'Dark Mode';
    });

    document.getElementById('closeDetails').addEventListener('click', () => {
        document.getElementById('elementDetails').classList.add('hidden');
    });

    document.getElementById('closeQuiz').addEventListener('click', () => {
        document.getElementById('quizOverlay').classList.add('hidden');
    });

    document.getElementById('readMoreBtn').addEventListener('click', () => {
        const symbol = document.getElementById('elemSymbol').textContent;
        window.open(`readmore.html?symbol=${encodeURIComponent(symbol)}`, '_blank');
    });

    document.getElementById('startQuizBtn').addEventListener('click', () => {
        startQuiz();
    });
}

function showDetails(el) {
    document.getElementById('elemName').textContent = el.name;
    document.getElementById('elemSymbol').textContent = el.symbol;
    document.getElementById('elemNumber').textContent = el.number;
    document.getElementById('elemMass').textContent = el.atomic_mass || 'N/A';
    document.getElementById('elemCategory').textContent = el.category || 'N/A';
    document.getElementById('elemGroup').textContent = el.xpos || 'N/A';
    document.getElementById('elemPeriod').textContent = el.ypos || 'N/A';
    document.getElementById('elemElectron').textContent = el.electron_configuration || 'N/A';
    document.getElementById('elemState').textContent = el.phase || 'N/A';

    const imgUrl = el.image && el.image.url ? el.image.url : `https://images-of-elements.com/${el.symbol.toLowerCase()}.png`;
    document.getElementById('elemImage').src = imgUrl;
    document.getElementById('elementDetails').classList.remove('hidden');
}

// State for active quiz
let currentQuiz = {
    questions: [],
    currentIndex: 0,
    score: 0,
    elementName: '',
    difficulty: 'easy'
};

function startQuiz() {
    const symbolStr = document.getElementById('elemSymbol').textContent;
    const element = elements.find(e => e.symbol === symbolStr);
    if (!element) return;

    const difficulty = document.getElementById('quizDifficulty').value;

    currentQuiz = {
        questions: [],
        currentIndex: 0,
        score: 0,
        elementName: element.name,
        difficulty: difficulty
    };

    const allTemplates = [
        { q: `What is the atomic number of ${element.name}?`, a: element.number, key: 'number', level: 'easy' },
        { q: `What is the chemical symbol of ${element.name}?`, a: element.symbol, key: 'symbol', level: 'easy' },
        { q: `What is the category of ${element.name}?`, a: element.category, key: 'category', level: 'easy' },
        { q: `Which group does ${element.name} belong to?`, a: element.xpos, key: 'xpos', level: 'medium' },
        { q: `In which period is ${element.name} located?`, a: element.ypos, key: 'ypos', level: 'medium' },
        { q: `State of ${element.name} at room temperature?`, a: element.phase, key: 'phase', level: 'medium' },
        { q: `What is the atomic mass of ${element.name}?`, a: element.atomic_mass, key: 'atomic_mass', level: 'hard' },
        { q: `What is the density of ${element.name}?`, a: element.density, key: 'density', level: 'hard' },
        { q: `Boiling point of ${element.name}?`, a: element.boil, key: 'boil', level: 'hard' }
    ];

    const filteredTemplates = allTemplates.filter(t => {
        if (difficulty === 'easy') return t.level === 'easy';
        if (difficulty === 'medium') return t.level === 'easy' || t.level === 'medium';
        return true;
    });

    const shuffled = filteredTemplates.sort(() => Math.random() - 0.5);
    const numQuestions = Math.min(5, shuffled.length);

    for (let i = 0; i < numQuestions; i++) {
        const t = shuffled[i];
        const fake = [];
        while (fake.length < 15) {
            const rand = elements[Math.floor(Math.random() * elements.length)];
            const val = rand[t.key];
            if (val !== undefined && val !== null && val !== t.a) {
                fake.push(val);
            }
        }
        const uniqueFakes = [...new Set(fake)].slice(0, 3);
        const options = [t.a, ...uniqueFakes].sort(() => Math.random() - 0.5);
        currentQuiz.questions.push({ q: t.q, a: t.a, options });
    }

    document.getElementById('quizOverlay').classList.remove('hidden');
    renderQuestion();
}

function renderQuestion() {
    const content = document.getElementById('quizContent');
    const q = currentQuiz.questions[currentQuiz.currentIndex];

    if (!q) {
        showResults();
        return;
    }

    content.innerHTML = `
        <h3>Question ${currentQuiz.currentIndex + 1} of ${currentQuiz.questions.length}</h3>
        <p style="font-size: 1.2rem; margin: 1rem 0;">${q.q}</p>
        <div class="quiz-options">
            ${q.options.map(opt => `<button class="quiz-option" onclick="handleAnswer('${opt}')">${opt}</button>`).join('')}
        </div>
    `;
}

window.handleAnswer = (selected) => {
    const q = currentQuiz.questions[currentQuiz.currentIndex];
    if (selected == q.a) {
        currentQuiz.score++;
        document.getElementById('correctSound').play();
    } else {
        document.getElementById('wrongSound').play();
    }
    currentQuiz.currentIndex++;
    renderQuestion();
};

function showResults() {
    const content = document.getElementById('quizContent');
    content.innerHTML = `
        <h2>Quiz Complete!</h2>
        <p style="font-size: 1.5rem; margin: 1.5rem 0;">You scored ${currentQuiz.score} out of ${currentQuiz.questions.length} for <strong>${currentQuiz.elementName}</strong>.</p>
        <button onclick="document.getElementById('quizOverlay').classList.add('hidden')" style="width: 100%; border-radius: 12px; font-weight: 600;">Back to Table</button>
    `;
}

init();
