const tg = window.Telegram.WebApp;
tg.expand();

// Состояние приложения
const state = {
    balance: 2000,
    currency: "BOONT",
    lastBonusDate: null,
    activeSection: 'live',
    matches: {
        live: [
            {
                id: 1,
                team1: "Natus Vincere",
                team2: "Team Spirit",
                odds1: 1.8,
                odds2: 2.0,
                time: "Live"
            }
        ],
        upcoming: []
    },
    userBets: []
};

// Проверка и выдача ежедневного бонуса
function checkDailyBonus() {
    const today = new Date().toDateString();
    
    if (state.lastBonusDate !== today) {
        state.balance += 1000;
        state.lastBonusDate = today;
        updateBalance();
        
        tg.showAlert(`🎉 Вы получили ежедневный бонус 1000 ${state.currency}!`);
        saveToLocalStorage();
    }
}

// Сохранение в localStorage
function saveToLocalStorage() {
    localStorage.setItem('boontData', JSON.stringify({
        balance: state.balance,
        lastBonusDate: state.lastBonusDate
    }));
}

// Загрузка из localStorage
function loadFromLocalStorage() {
    const data = localStorage.getItem('boontData');
    if (data) {
        const parsed = JSON.parse(data);
        state.balance = parsed.balance || 2000;
        state.lastBonusDate = parsed.lastBonusDate;
    }
}

// Обновление отображения баланса
function updateBalance() {
    document.getElementById('user-balance').textContent = 
        `Баланс: ${state.balance} ${state.currency}`;
}

// Инициализация приложения
function init() {
    loadFromLocalStorage();
    updateBalance();
    checkDailyBonus(); // Проверяем бонус при запуске
    loadMatches();
    setupNavigation();
    
    // Добавляем кнопку бонуса (для теста)
    const bonusBtn = document.createElement('button');
    bonusBtn.textContent = `🎁 Получить бонус`;
    bonusBtn.style.margin = '10px';
    bonusBtn.onclick = checkDailyBonus;
    document.body.prepend(bonusBtn);
}

// Остальные функции (placeBet, loadMatches и т.д.) остаются без изменений
