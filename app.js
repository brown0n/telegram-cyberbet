// Инициализация Telegram WebApp
const tg = window.Telegram.WebApp;
tg.expand();

// Состояние приложения
const state = {
    balance: 1000,
    activeSection: 'live',
    matches: {
        live: [],
        upcoming: []
    },
    userBets: []
};

// Инициализация приложения
function init() {
    // Загружаем данные пользователя
    if (tg.initDataUnsafe.user) {
        document.getElementById('user-balance').textContent = `Баланс: ${state.balance} ₽`;
    }
    
    // Загружаем матчи
    loadMatches();
    
    // Навигация
    setupNavigation();
}

// Загрузка матчей (заглушка)
function loadMatches() {
    // В реальном приложении здесь был бы запрос к API
    state.matches.live = [
        {
            id: 1,
            team1: "Natus Vincere",
            team2: "Team Spirit",
            odds1: 1.8,
            odds2: 2.0,
            time: "Live"
        },
        {
            id: 2,
            team1: "Virtus.pro",
            team2: "G2 Esports",
            odds1: 2.5,
            odds2: 1.5,
            time: "2-й карта"
        }
    ];
    
    state.matches.upcoming = [
        {
            id: 3,
            team1: "Fnatic",
            team2: "Astralis",
            odds1: 1.7,
            odds2: 2.1,
            time: "Через 2 часа"
        }
    ];
    
    renderContent();
}

// Настройка навигации
function setupNavigation() {
    const buttons = document.querySelectorAll('nav button');
    buttons.forEach(button => {
        button.addEventListener('click', () => {
            buttons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            state.activeSection = button.dataset.section;
            renderContent();
        });
    });
}

// Рендер контента
function renderContent() {
    const contentEl = document.getElementById('content');
    
    switch (state.activeSection) {
        case 'live':
        case 'upcoming':
            renderMatches(contentEl);
            break;
        case 'bets':
            renderUserBets(contentEl);
            break;
    }
}

// Рендер списка матчей
function renderMatches(container) {
    const matches = state.matches[state.activeSection];
    
    if (matches.length === 0) {
        container.innerHTML = '<div class="match-card">Нет доступных матчей</div>';
        return;
    }
    
    container.innerHTML = matches.map(match => `
        <div class="match-card">
            <div class="match-teams">
                <span>${match.team1}</span>
                <span>vs</span>
                <span>${match.team2}</span>
            </div>
            <div class="match-time">${match.time}</div>
            <div class="match-odds">
                <button class="odd-button" data-match="${match.id}" data-team="1" data-odd="${match.odds1}">
                    ${match.team1} (${match.odds1})
                </button>
                <button class="odd-button" data-match="${match.id}" data-team="2" data-odd="${match.odds2}">
                    ${match.team2} (${match.odds2})
                </button>
            </div>
        </div>
    `).join('');
    
    // Добавляем обработчики ставок
    document.querySelectorAll('.odd-button').forEach(button => {
        button.addEventListener('click', (e) => {
            const matchId = parseInt(button.dataset.match);
            const team = parseInt(button.dataset.team);
            const odd = parseFloat(button.dataset.odd);
            
            placeBet(matchId, team, odd);
        });
    });
}

// Рендер ставок пользователя
function renderUserBets(container) {
    if (state.userBets.length === 0) {
        container.innerHTML = '<div class="match-card">У вас нет активных ставок</div>';
        return;
    }
    
    container.innerHTML = state.userBets.map(bet => `
        <div class="match-card">
            <div class="match-teams">
                <span>${bet.team1} vs ${bet.team2}</span>
            </div>
            <div>Ставка: ${bet.amount} ₽ на ${bet.teamSelected} (коэф. ${bet.odd})</div>
            <div>Статус: ${bet.status}</div>
            <div>Возможный выигрыш: ${Math.round(bet.amount * bet.odd)} ₽</div>
        </div>
    `).join('');
}

// Размещение ставки
function placeBet(matchId, team, odd) {
    const match = [...state.matches.live, ...state.matches.upcoming].find(m => m.id === matchId);
    
    if (!match) return;
    
    // В реальном приложении здесь был бы запрос к API
    const betAmount = 100; // Фиксированная сумма для примера
    
    if (betAmount > state.balance) {
        tg.showAlert("Недостаточно средств на балансе");
        return;
    }
    
    const newBet = {
        matchId,
        team1: match.team1,
        team2: match.team2,
        teamSelected: team === 1 ? match.team1 : match.team2,
        odd,
        amount: betAmount,
        status: "В процессе"
    };
    
    state.userBets.push(newBet);
    state.balance -= betAmount;
    
    document.getElementById('user-balance').textContent = `Баланс: ${state.balance} ₽`;
    tg.showPopup({
        title: "Ставка размещена!",
        message: `Вы поставили ${betAmount} ₽ на ${newBet.teamSelected} с коэффициентом ${odd}`,
        buttons: [{ type: "ok" }]
    });
    
    if (state.activeSection === 'bets') {
        renderContent();
    }
}

// Запуск приложения
document.addEventListener('DOMContentLoaded', init);
