const tg = window.Telegram.WebApp;
tg.expand();
tg.setHeaderColor('#2E4F4F');
tg.setBackgroundColor('#121212');

// Состояние приложения
const state = {
    balance: 2000,
    currency: "BOONT",
    activeTab: 'tournaments',
    predictions: {},
    userBets: [],
    lastBonusDate: null
};

// Ключи для хранения данных
const STORAGE_KEYS = {
    BALANCE: 'boont_balance',
    BETS: 'boont_bets',
    BONUS_DATE: 'boont_last_bonus'
};

// Инициализация
async function init() {
    await loadData();
    renderPredictions();
    setupEventListeners();
    checkDailyBonus();
}

// ======================
// Система сохранения данных
// ======================

async function saveData() {
    try {
        // Пробуем сохранить в CloudStorage Telegram
        if (tg?.CloudStorage?.setItem) {
            await tg.CloudStorage.setItem(STORAGE_KEYS.BALANCE, state.balance.toString());
            await tg.CloudStorage.setItem(STORAGE_KEYS.BETS, JSON.stringify(state.userBets));
            await tg.CloudStorage.setItem(STORAGE_KEYS.BONUS_DATE, state.lastBonusDate || '');
        } 
        // Fallback на localStorage
        else {
            localStorage.setItem(STORAGE_KEYS.BALANCE, state.balance);
            localStorage.setItem(STORAGE_KEYS.BETS, JSON.stringify(state.userBets));
            localStorage.setItem(STORAGE_KEYS.BONUS_DATE, state.lastBonusDate || '');
        }
    } catch (e) {
        console.error("Ошибка сохранения:", e);
    }
}

async function loadData() {
    try {
        // Пробуем загрузить из CloudStorage Telegram
        if (tg?.CloudStorage?.getItem) {
            const balance = await tg.CloudStorage.getItem(STORAGE_KEYS.BALANCE);
            const bets = await tg.CloudStorage.getItem(STORAGE_KEYS.BETS);
            const bonusDate = await tg.CloudStorage.getItem(STORAGE_KEYS.BONUS_DATE);
            
            state.balance = balance ? parseInt(balance) : 2000;
            state.userBets = bets ? JSON.parse(bets) : [];
            state.lastBonusDate = bonusDate || null;
        } 
        // Fallback на localStorage
        else {
            state.balance = parseInt(localStorage.getItem(STORAGE_KEYS.BALANCE)) || 2000;
            state.userBets = JSON.parse(localStorage.getItem(STORAGE_KEYS.BETS)) || [];
            state.lastBonusDate = localStorage.getItem(STORAGE_KEYS.BONUS_DATE) || null;
        }
    } catch (e) {
        console.error("Ошибка загрузки:", e);
    }
    
    updateUI();
}

// ======================
// Бизнес-логика
// ======================

async function placeBet(predictionId, optionId, odds) {
    const betAmount = 100;
    
    if (state.balance < betAmount) {
        tg.showAlert("Недостаточно BOONT!");
        tg.HapticFeedback.notificationOccurred('error');
        return;
    }

    state.balance -= betAmount;
    state.userBets.push({
        id: Date.now(),
        predictionId,
        optionId,
        amount: betAmount,
        odds,
        date: new Date().toISOString(),
        status: 'active'
    });

    await saveData();
    updateUI();
    tg.showAlert(`Ставка ${betAmount} BOONT принята!`);
    tg.HapticFeedback.notificationOccurred('success');
}

async function checkDailyBonus() {
    const today = new Date().toDateString();
    
    if (state.lastBonusDate !== today) {
        state.balance += 1000;
        state.lastBonusDate = today;
        await saveData();
        updateUI();
        
        tg.showAlert(`🎉 Ежедневный бонус 1000 BOONT!`);
        tg.HapticFeedback.notificationOccurred('success');
    }
}

// ======================
// Вспомогательные функции
// ======================

function updateUI() {
    // Обновляем баланс
    document.querySelector('.balance').textContent = state.balance.toLocaleString();
    
    // Обновляем историю ставок (если есть такой раздел)
    if (document.getElementById('history-list')) {
        renderHistory();
    }
}

function renderPredictions() {
    const container = document.querySelector('.predictions-list');
    container.innerHTML = getPredictions().map(prediction => `
        <div class="prediction-card">
            <!-- Ваш существующий HTML для карточки прогноза -->
            <div class="options-container">
                ${prediction.options.map(option => `
                    <button class="option-btn" 
                            data-prediction="${prediction.id}" 
                            data-option="${option.id}"
                            data-odds="${option.odds}">
                        <div class="option-text">${option.text}</div>
                        <div class="option-odds">${option.odds}x</div>
                    </button>
                `).join('')}
            </div>
        </div>
    `).join('');
}

function renderHistory() {
    const container = document.getElementById('history-list');
    container.innerHTML = state.userBets.map(bet => `
        <div class="bet-item">
            <div>Ставка: ${bet.amount} BOONT</div>
            <div>Коэффициент: ${bet.odds}x</div>
            <div>Статус: ${bet.status === 'win' ? '✅ Выигрыш' : 
                         bet.status === 'lose' ? '❌ Проигрыш' : '🔄 В процессе'}</div>
        </div>
    `).join('');
}

// ======================
// Обработчики событий
// ======================

function setupEventListeners() {
    // Обработчик ставок
    document.addEventListener('click', async (e) => {
        if (e.target.closest('.option-btn')) {
            const btn = e.target.closest('.option-btn');
            const predictionId = btn.dataset.prediction;
            const optionId = btn.dataset.option;
            const odds = parseFloat(btn.dataset.odds);
            
            tg.showPopup({
                title: "Подтверждение ставки",
                message: `Ставить 100 BOONT (коэф. ${odds}x)?`,
                buttons: [
                    { type: "default", text: "Подтвердить", id: "confirm" },
                    { type: "cancel" }
                ]
            }, async (btnId) => {
                if (btnId === 'confirm') {
                    await placeBet(predictionId, optionId, odds);
                }
            });
        }
    });
}

// Запуск приложения
document.addEventListener('DOMContentLoaded', init);
