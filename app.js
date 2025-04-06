const tg = window.Telegram.WebApp;
const USER_DATA_KEY = 'boont_user_data';

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
    renderUI();
    setupEventListeners();
    
    // Проверка бонуса при запуске
    checkDailyBonus();
}

// ======================
// Система сохранения данных
// ======================

async function saveUserData() {
    const dataToSave = {
        balance: state.balance,
        bets: state.bets,
        lastBonusDate: state.lastBonusDate
    };

    try {
        // Пробуем сохранить в CloudStorage Telegram
        if (tg?.CloudStorage?.setItem) {
            await tg.CloudStorage.setItem(USER_DATA_KEY, JSON.stringify(dataToSave));
            console.log("Данные сохранены в CloudStorage");
        }
        
        // Всегда сохраняем в localStorage как fallback
        localStorage.setItem(USER_DATA_KEY, JSON.stringify(dataToSave));
    } catch (e) {
        console.error("Ошибка сохранения:", e);
    }
}

async function loadUserData() {
    let loadedData = null;
    
    try {
        // Пробуем загрузить из CloudStorage Telegram
        if (tg?.CloudStorage?.getItem) {
            const cloudData = await tg.CloudStorage.getItem(USER_DATA_KEY);
            if (cloudData) loadedData = JSON.parse(cloudData);
        }
        
        // Если в CloudStorage нет, пробуем localStorage
        if (!loadedData) {
            const localData = localStorage.getItem(USER_DATA_KEY);
            if (localData) loadedData = JSON.parse(localData);
        }
        
        if (loadedData) {
            state.balance = loadedData.balance || 2000;
            state.bets = loadedData.bets || [];
            state.lastBonusDate = loadedData.lastBonusDate || null;
        }
    } catch (e) {
        console.error("Ошибка загрузки:", e);
    }
}

// ======================
// Бизнес-логика
// ======================

async function placeBet(amount, prediction, option) {
    if (state.balance < amount) {
        showNotification("Недостаточно BOONT!", 'error');
        return false;
    }

    state.balance -= amount;
    state.bets.push({
        id: Date.now(),
        amount,
        prediction,
        option,
        date: new Date().toISOString(),
        status: 'active'
    });

    await saveUserData();
    updateBalanceDisplay();
    showNotification(`Ставка ${amount} BOONT принята!`, 'success');
    return true;
}

async function checkDailyBonus() {
    const today = new Date().toDateString();
    
    if (!state.lastBonusDate || state.lastBonusDate !== today) {
        state.balance += 1000;
        state.lastBonusDate = today;
        await saveUserData();
        updateBalanceDisplay();
        showNotification("🎉 Ежедневный бонус 1000 BOONT!", 'success');
    }
}

// ======================
// Работа с интерфейсом
// ======================

function updateBalanceDisplay() {
    const balanceEl = document.querySelector('.balance');
    if (balanceEl) balanceEl.textContent = state.balance.toLocaleString();
}

function showNotification(text, type = 'info') {
    const notification = document.getElementById('notification');
    if (!notification) return;
    
    notification.textContent = text;
    notification.className = 'notification ' + type;
    notification.classList.add('show');
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

function renderUI() {
    updateBalanceDisplay();
    // Другие функции рендеринга...
}

function setupEventListeners() {
    // Обработчик кнопки бонуса
    document.getElementById('bonus-btn')?.addEventListener('click', checkDailyBonus);
    
    // Обработчики ставок...
}

// Обработчик закрытия приложения
tg.onEvent('viewportChanged', async (e) => {
    if (e.isStateStable && !tg.isExpanded) {
        await saveUserData();
    }
});

// Запуск приложения
document.addEventListener('DOMContentLoaded', init);
