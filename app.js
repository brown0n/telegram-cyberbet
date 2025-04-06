const tg = window.Telegram.WebApp;
tg.expand();
tg.setHeaderColor('#2E4F4F');
tg.setBackgroundColor('#f5f5f5');

// Инициализация приложения
function init() {
    setupTabSwitcher();
    setupDepositButton();
}

// Переключение между вкладками
function setupTabSwitcher() {
    const tabs = document.querySelectorAll('.tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Убираем активный класс у всех вкладок
            document.querySelector('.tab.active').classList.remove('active');
            document.querySelector('.tab-content.active').classList.remove('active');
            
            // Добавляем активный класс к выбранной вкладке
            tab.classList.add('active');
            const tabName = tab.dataset.tab;
            document.querySelector(`.tab-content[data-tab="${tabName}"]`).classList.add('active');
        });
    });
}

// Обработчик кнопки пополнения
function setupDepositButton() {
    document.querySelector('.deposit-btn').addEventListener('click', () => {
        tg.showPopup({
            title: "Пополнение баланса",
            message: "Выберите способ пополнения",
            buttons: [
                { type: "default", text: "Криптовалюты", id: "crypto" },
                { type: "default", text: "Банковская карта", id: "card" },
                { type: "cancel" }
            ]
        }, (buttonId) => {
            if (buttonId && buttonId !== "cancel") {
                tg.showAlert(`Выбран способ: ${buttonId === 'crypto' ? 'Криптовалюты' : 'Банковская карта'}`);
            }
        });
    });
}

// Запуск приложения
document.addEventListener('DOMContentLoaded', init);
