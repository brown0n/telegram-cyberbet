const tg = window.Telegram.WebApp;
tg.expand();
tg.setHeaderColor('#2E4F4F');
tg.setBackgroundColor('#121212');

// Состояние приложения
const state = {
    balance: 2000,
    currency: "BOONT",
    activeTab: 'tournaments',
    predictions: {
        tournaments: [
            {
                id: 1,
                title: "BLAST Premier World Final 2023",
                teams: [
                    { name: "NAVI", logo: "assets/teams/navi.png" },
                    { name: "Vitality", logo: "assets/teams/vitality.png" }
                ],
                options: [
                    { id: 1, text: "NAVI победа", odds: 2.1 },
                    { id: 2, text: "Vitality победа", odds: 1.8 }
                ],
                date: "Сегодня, 20:00",
                isLive: true
            }
        ],
        matches: [
            // Другие матчи
        ]
    }
};

function init() {
    updateBalance();
    renderPredictions();
    setupEventListeners();
}

function updateBalance() {
    document.querySelector('.balance').textContent = state.balance.toLocaleString();
    document.querySelector('.currency').textContent = state.currency;
}

function renderPredictions() {
    const container = document.querySelector('.predictions-list');
    const predictions = state.predictions[state.activeTab];
    
    container.innerHTML = predictions.map(prediction => `
        <div class="prediction-card">
            <div class="prediction-title">
                ${prediction.title}
                ${prediction.isLive ? '<span class="live-badge">LIVE</span>' : ''}
            </div>
            
            <div class="match-teams">
                <div class="team">
                    <img src="${prediction.teams[0].logo}" alt="${prediction.teams[0].name}" class="team-logo">
                    <span>${prediction.teams[0].name}</span>
                </div>
                
                <span class="vs">VS</span>
                
                <div class="team" style="justify-content: flex-end;">
                    <span>${prediction.teams[1].name}</span>
                    <img src="${prediction.teams[1].logo}" alt="${prediction.teams[1].name}" class="team-logo">
                </div>
            </div>
            
            <div class="options-container">
                ${prediction.options.map(option => `
                    <button class="option-btn" 
                            data-prediction="${prediction.id}" 
                            data-option="${option.id}">
                        <div class="option-text">${option.text}</div>
                        <div class="option-odds">${option.odds}x</div>
                    </button>
                `).join('')}
            </div>
            
            <div class="prediction-footer">
                <span>CS2 • ${prediction.date}</span>
                <span>BOONT</span>
            </div>
        </div>
    `).join('');
}

function setupEventListeners() {
    // Переключение табов
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelector('.tab.active').classList.remove('active');
            tab.classList.add('active');
            state.activeTab = tab.textContent === 'Турниры' ? 'tournaments' : 
                            tab.textContent === 'Матчи' ? 'matches' : 'stats';
            renderPredictions();
        });
    });

    // Обработка ставок
    document.addEventListener('click', (e) => {
        if (e.target.closest('.option-btn')) {
            const btn = e.target.closest('.option-btn');
            const predictionId = btn.dataset.prediction;
            const optionId = btn.dataset.option;
            
            tg.showPopup({
                title: "Подтверждение ставки",
                message: `Вы уверены, что хотите сделать ставку 100 BOONT?`,
                buttons: [
                    { type: "default", text: "Подтвердить", id: "confirm" },
                    { type: "cancel", id: "cancel" }
                ]
            }, (btnId) => {
                if (btnId === 'confirm') {
                    placeBet(predictionId, optionId);
                }
            });
        }
    });
}

function placeBet(predictionId, optionId) {
    // В реальном приложении здесь будет запрос к API
    state.balance -= 100;
    updateBalance();
    
    tg.showAlert("Ставка 100 BOONT принята!");
    tg.HapticFeedback.impactOccurred('medium');
}

document.addEventListener('DOMContentLoaded', init);
