const tg = window.Telegram.WebApp;
const USER_DATA_KEY = 'boont_cs2_data';

// Актуальные турниры и матчи CS2 (июль 2024)
const CS2_DATA = {
    matches: [
        {
            id: 1,
            tournament: "BLAST Premier Fall Groups 2024",
            team1: { name: "NAVI", logo: "navi.png" },
            team2: { name: "Vitality", logo: "vitality.png" },
            date: "Сегодня, 20:00",
            isLive: true,
            bets: [
                { option: "Победа NAVI", odds: 2.1 },
                { option: "Победа Vitality", odds: 1.7 },
                { option: "Тотал > 2.5 карты", odds: 1.9 }
            ]
        },
        {
            id: 2,
            tournament: "IEM Cologne 2024",
            team1: { name: "FaZe Clan", logo: "faze.png" },
            team2: { name: "G2 Esports", logo: "g2.png" },
            date: "Завтра, 18:00",
            isLive: false,
            bets: [
                { option: "Победа FaZe", odds: 1.8 },
                { option: "Победа G2", odds: 2.0 },
                { option: "Обе карты > 12 раундов", odds: 2.2 }
            ]
        }
    ],
    tournaments: [
        {
            id: 101,
            name: "BLAST Premier World Final 2024",
            prize: "$1,000,000",
            teams: ["NAVI", "Vitality", "FaZe", "G2", "Spirit", "MOUZ"],
            startDate: "15.12.2024",
            bets: [
                { option: "Победитель: NAVI", odds: 3.5 },
                { option: "Победитель: Vitality", odds: 2.8 },
                { option: "Русский финал", odds: 4.2 }
            ]
        }
    ]
};

// Состояние приложения
const state = {
    balance: 2000,
    currency: "BOONT",
    bets: [],
    lastBonusDate: null
};

// Инициализация
async function init() {
    tg.expand();
    tg.setHeaderColor('#2E4F4F');
    tg.setBackgroundColor('#121212');
    
    await loadUserData();
    renderAllContent();
    setupEventListeners();
    checkDailyBonus();
}

// ======================
// Система сохранения данных
// ======================

async function saveUserData() {
    const data = {
        balance: state.balance,
        bets: state.bets,
        lastBonusDate: state.lastBonusDate,
        userId: tg.initDataUnsafe.user?.id
    };

    try {
        // CloudStorage Telegram
        if (tg?.CloudStorage?.setItem) {
            await tg.CloudStorage.setItem(USER_DATA_KEY, JSON.stringify(data));
        }
        // LocalStorage как fallback
        localStorage.setItem(USER_DATA_KEY, JSON.stringify(data));
    } catch (e) {
        console.error("Ошибка сохранения:", e);
    }
}

async function loadUserData() {
    try {
        let data = null;
        
        // Пробуем CloudStorage
        if (tg?.CloudStorage?.getItem) {
            const cloudData = await tg.CloudStorage.getItem(USER_DATA_KEY);
            if (cloudData) data = JSON.parse(cloudData);
        }
        
        // Если нет - пробуем localStorage
        if (!data) {
            const localData = localStorage.getItem(USER_DATA_KEY);
            if (localData) data = JSON.parse(localData);
        }
        
        // Проверяем, что данные принадлежат текущему пользователю
        if (data && (!data.userId || data.userId === tg.initDataUnsafe.user?.id)) {
            state.balance = data.balance || 2000;
            state.bets = data.bets || [];
            state.lastBonusDate = data.lastBonusDate || null;
        }
    } catch (e) {
        console.error("Ошибка загрузки:", e);
    }
}

// ======================
// Бизнес-логика
// ======================

async function placeBet(amount, predictionId, optionIndex, isTournament = false) {
    const predictionType = isTournament ? 'tournament' : 'match';
    const prediction = isTournament 
        ? CS2_DATA.tournaments.find(t => t.id === predictionId)
        : CS2_DATA.matches.find(m => m.id === predictionId);

    if (!prediction || !prediction.bets[optionIndex]) {
        showNotification("Ошибка ставки", "error");
        return false;
    }

    const betAmount = Math.min(amount, state.balance);
    if (betAmount <= 0) {
        showNotification("Недостаточно BOONT", "error");
        return false;
    }

    state.balance -= betAmount;
    state.bets.unshift({
        id: Date.now(),
        amount: betAmount,
        predictionId,
        predictionType,
        option: prediction.bets[optionIndex].option,
        odds: prediction.bets[optionIndex].odds,
        date: new Date().toLocaleString(),
        status: "active"
    });

    await saveUserData();
    updateUI();
    showNotification(`Ставка ${betAmount} BOONT принята!`, "success");
    tg.HapticFeedback.impactOccurred('rigid');
    return true;
}

async function checkDailyBonus() {
    const today = new Date().toDateString();
    if (state.lastBonusDate !== today) {
        state.balance += 1000;
        state.lastBonusDate = today;
        await saveUserData();
        updateUI();
        showNotification("🎉 Ежедневный бонус +1000 BOONT!", "success");
        tg.HapticFeedback.notificationOccurred('success');
    }
}

// ======================
// Рендеринг интерфейса
// ======================

function renderAllContent() {
    renderMatches();
    renderTournaments();
    renderHistory();
    updateBalance();
}

function renderMatches() {
    const container = document.getElementById('matches-list');
    if (!container) return;

    container.innerHTML = CS2_DATA.matches.map(match => `
        <div class="prediction-card">
            <div class="prediction-header">
                <span class="prediction-title">${match.tournament}</span>
                ${match.isLive ? '<span class="live-badge">LIVE</span>' : ''}
            </div>
            <div class="prediction-date">${match.date}</div>
            
            <div class="match-teams">
                <div class="team left">
                    <img src="assets/teams/${match.team1.logo}" alt="${match.team1.name}" class="team-logo">
                    <span class="team-name">${match.team1.name}</span>
                </div>
                
                <span class="vs">VS</span>
                
                <div class="team right">
                    <span class="team-name">${match.team2.name}</span>
                    <img src="assets/teams/${match.team2.logo}" alt="${match.team2.name}" class="team-logo">
                </div>
            </div>
            
            <div class="options-container">
                ${match.bets.map((bet, index) => `
                    <button class="option-btn" 
                            data-match-id="${match.id}"
                            data-option-index="${index}">
                        <div class="option-text">${bet.option}</div>
                        <div class="option-odds">${bet.odds}x</div>
                    </button>
                `).join('')}
            </div>
        </div>
    `).join('');
}

function renderTournaments() {
    const container = document.getElementById('tournaments-list');
    if (!container) return;

    container.innerHTML = CS2_DATA.tournaments.map(tournament => `
        <div class="prediction-card">
            <div class="prediction-header">
                <span class="prediction-title">${tournament.name}</span>
                <span class="prediction-date">Приз: ${tournament.prize}</span>
            </div>
            
            <div class="teams-preview">
                ${tournament.teams.slice(0, 6).map(team => `
                    <img src="assets/teams/${team.toLowerCase().replace(' ', '-')}.png" 
                         alt="${team}" 
                         class="team-icon"
                         title="${team}">
                `).join('')}
            </div>
            
            <div class="options-container">
                ${tournament.bets.map((bet, index) => `
                    <button class="option-btn" 
                            data-tournament-id="${tournament.id}"
                            data-option-index="${index}"
                            data-is-tournament="true">
                        <div class="option-text">${bet.option}</div>
                        <div class="option-odds">${bet.odds}x</div>
                    </button>
                `).join('')}
            </div>
            
            <div class="prediction-footer">
                <span>Начало: ${tournament.startDate}</span>
            </div>
        </div>
    `).join('');
}

function renderHistory() {
    const container = document.getElementById('history-list');
    if (!container) return;

    container.innerHTML = state.bets.length > 0 
        ? state.bets.map(bet => `
            <div class="bet-item ${bet.status}">
                <div class="bet-header">
                    <span class="bet-amount">${bet.amount} BOONT</span>
                    <span class="bet-date">${bet.date}</span>
                </div>
                <div class="bet-details">
                    <span class="bet-option">${bet.option} (${bet.odds}x)</span>
                    <span class="bet-status">
                        ${bet.status === 'win' ? '✅ Выигрыш' : 
                          bet.status === 'lose' ? '❌ Проигрыш' : '🔄 В процессе'}
                    </span>
                </div>
            </div>
        `).join('')
        : '<div class="empty-history">Нет завершенных ставок</div>';
}

function updateBalance() {
    const balanceEl = document.querySelector('.balance');
    if (balanceEl) balanceEl.textContent = state.balance.toLocaleString();
}

function updateUI() {
    updateBalance();
    renderHistory();
}

function showNotification(text, type = 'info') {
    const notification = document.getElementById('notification');
    if (!notification) return;
    
    notification.textContent = text;
    notification.className = `notification ${type} show`;
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

// ======================
// Обработчики событий
// ======================

function setupEventListeners() {
    // Табы
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelector('.tab.active').classList.remove('active');
            tab.classList.add('active');
            
            document.querySelector('.tab-content.active').classList.remove('active');
            document.querySelector(`.tab-content[data-tab="${tab.dataset.tab}"]`).classList.add('active');
        });
    });

    // Кнопка бонуса
    document.getElementById('bonus-btn')?.addEventListener('click', checkDailyBonus);

    // Ставки на матчи
    document.addEventListener('click', async (e) => {
        const betBtn = e.target.closest('.option-btn');
        if (!betBtn) return;
        
        const matchId = betBtn.dataset.matchId;
        const tournamentId = betBtn.dataset.tournamentId;
        const optionIndex = parseInt(betBtn.dataset.optionIndex);
        const isTournament = betBtn.dataset.isTournament === 'true';
        
        tg.showPopup({
            title: "Подтверждение ставки",
            message: `Сделать ставку 100 BOONT?`,
            buttons: [
                { type: "default", text: "Подтвердить", id: "confirm" },
                { type: "cancel" }
            ]
        }, async (btnId) => {
            if (btnId === 'confirm') {
                await placeBet(100, matchId || tournamentId, optionIndex, isTournament);
            }
        });
    });

    // Сохранение при закрытии
    tg.onEvent('viewportChanged', async (e) => {
        if (!tg.isExpanded) {
            await saveUserData();
        }
    });
}

// Запуск приложения
document.addEventListener('DOMContentLoaded', init);
