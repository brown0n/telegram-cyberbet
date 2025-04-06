const tg = window.Telegram.WebApp;
tg.expand();

// Инициализация приложения
function init() {
    // Здесь может быть логика загрузки данных
    console.log("App initialized");
}

// Обработчик кнопки подписки
document.querySelector('.subscribe-btn').addEventListener('click', () => {
    tg.showAlert("Подписка оформлена!");
});

// Запуск приложения
document.addEventListener('DOMContentLoaded', init);
