const tg = window.Telegram.WebApp;
const USER_DATA_KEY = 'boont_user_data';

// Initial state
const state = {
    balance: 2000,
    currency: "BOONT",
    bets: [],
    lastBonusDate: null,
    currentTournament: {
        id: 1,
        name: "PGL Bucharest 2025",
        dates: "Apr 6th - Apr 13th 2025",
        prize: "$1.250.000"
    },
    matches: [
        {
            id: 101,
            team1: { name: "NAVI", logo: "navi.png" },
            team2: { name: "Vitality", logo: "vitality.png" },
            time: "Сегодня, 20:00 CEST",
            isLive: true,
            mainBets: [
                { option: "Победа NAVI", odds: 2.10 },
                { option: "Победа Vitality", odds: 1.70 },
                { option: "Тотал > 2.5 карты", odds: 1.95 }
            ],
            handicapBets: [
                { option: "NAVI +1.5", odds: 1.45 },
                { option: "Vitality -1.5", odds: 2.60 }
            ]
        },
        {
            id: 102,
            team1: { name: "FaZe Clan", logo: "faze.png" },
            team2: { name: "G2 Esports", logo: "g2.png" },
            time: "Завтра, 18:00 CEST",
            isLive: false,
            mainBets: [
                { option: "Победа FaZe", odds: 1.85 },
                { option: "Победа G2", odds: 1.90 },
                { option: "Овертайм", odds: 3.25 }
            ],
            handicapBets: [
                { option: "FaZe +1.5", odds: 1.30 },
                { option: "G2 -1.5", odds: 3.20 }
            ]
        }
    ]
};

// Initialize the app
async function init() {
    tg.expand();
    tg.setHeaderColor('#2E4F4F');
    tg.setBackgroundColor('#f5f5f5');
    
    await loadUserData();
    setupEventListeners();
    renderUI();
    
    // Check for daily bonus
    checkDailyBonus();
}

// Load user data from storage
async function loadUserData() {
    try {
        let data = null;
        
        // Try Telegram Cloud Storage
        if (tg?.CloudStorage?.getItem) {
            const cloudData = await tg.CloudStorage.getItem(USER_DATA_KEY);
            if (cloudData) data = JSON.parse(cloudData);
        }
        
        // Fallback to localStorage
        if (!data) {
            const localData = localStorage.getItem(USER_DATA_KEY);
            if (localData) data = JSON.parse(localData);
        }
        
        // Verify data belongs to current user
        if (data && (!data.userId || data.userId === tg.initDataUnsafe.user?.id)) {
            state.balance = data.balance || 2000;
            state.bets = data.bets || [];
            state.lastBonusDate = data.lastBonusDate || null;
        }
    } catch (e) {
        console.error("Error loading user data:", e);
    }
}

// Save user data
async function saveUserData() {
    const data = {
        balance: state.balance,
        bets: state.bets,
        lastBonusDate: state.lastBonusDate,
        userId: tg.initDataUnsafe.user?.id
    };

    try {
        // Save to Telegram Cloud Storage
        if (tg?.CloudStorage?.setItem) {
            await tg.CloudStorage.setItem(USER_DATA_KEY, JSON.stringify(data));
        }
        // Fallback to localStorage
        localStorage.setItem(USER_DATA_KEY, JSON.stringify(data));
    } catch (e) {
        console.error("Error saving user data:", e);
    }
}

// Check for daily bonus
function checkDailyBonus() {
    const today = new Date().toDateString();
    if (state.lastBonusDate !== today) {
        state.balance += 500;
        state.lastBonusDate = today;
        saveUserData();
        updateUI();
        showNotification("🎉 Ежедневный бонус +500 BOONT!", "success");
    }
}

// Render the UI
function renderUI() {
    renderTournamentInfo();
    renderMatches();
    renderBets();
    renderStats();
    updateBalance();
}

// Render tournament info
function renderTournamentInfo() {
    const tournamentInfo = document.querySelector('.current-tournament');
    if (tournamentInfo) {
        tournamentInfo.innerHTML = `
            <h2>${state.currentTournament.name}</h2>
            <p class="tournament-dates">${state.currentTournament.dates}</p>
            <p class="tournament-prize">Призовой фонд: ${state.currentTournament.prize}</p>
        `;
    }
}

// Render matches list
function renderMatches() {
    const matchesList = document.getElementById('matches-list');
    if (!matchesList) return;

    matchesList.innerHTML = state.matches.map(match => `
        <div class="match-card" data-match-id="${match.id}">
            <div class="match-teams">
                <div class="team left">
                    <span class="team-name">${match.team1.name}</span>
                </div>
                <span class="vs">VS</span>
                <div class="team right">
                    <span class="team-name">${match.team2.name}</span>
                </div>
            </div>
            <div class="match-info">
                <span>${match.time}</span>
                ${match.isLive ? '<span class="live-badge">LIVE</span>' : ''}
            </div>
            <div class="match-odds">
                ${match.mainBets.slice(0, 2).map(bet => `
                    <div class="odd-chip">${bet.option} (${bet.odds}x)</div>
                `).join('')}
            </div>
        </div>
    `).join('');
}

// Render bets list
function renderBets() {
    const betsList = document.getElementById('bets-list');
    if (!betsList) return;

    if (state.bets.length === 0) {
        betsList.innerHTML = '<p>У вас пока нет ставок</p>';
        return;
    }

    betsList.innerHTML = state.bets.map(bet => `
        <div class="bet-item ${bet.status === 'won' ? 'won' : bet.status === 'lost' ? 'lost' : ''}">
            <div class="bet-details">
                <span class="bet-event">${bet.event}</span>
                <span class="bet-amount">${bet.amount} BOONT</span>
            </div>
            <div class="bet-outcome">${bet.option} (${bet.odds}x)</div>
            <div class="bet-status">
                ${bet.status === 'won' ? '✅ Выигрыш' : 
                  bet.status === 'lost' ? '❌ Проигрыш' : '🔄 В процессе'}
            </div>
        </div>
    `).join('');
}

// Render stats
function renderStats() {
    const totalBets = state.bets.length;
    const wonBets = state.bets.filter(bet => bet.status === 'won').length;
    const wonAmount = state.bets
        .filter(bet => bet.status === 'won')
        .reduce((sum, bet) => sum + (bet.amount * bet.odds), 0);
    const successRate = totalBets > 0 ? Math.round((wonBets / totalBets) * 100) : 0;

    document.getElementById('total-bets').textContent = totalBets;
    document.getElementById('won-bets').textContent = Math.round(wonAmount) + ' BOONT';
    document.getElementById('success-rate').textContent = successRate + '%';
}

// Update balance display
function updateBalance() {
    const balanceEl = document.querySelector('.balance');
    if (balanceEl) balanceEl.textContent = state.balance.toLocaleString();
}

// Show notification
function showNotification(text, type = 'info') {
    tg.showAlert(text);
}

// Setup event listeners
function setupEventListeners() {
    // Tab switching
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelector('.tab.active').classList.remove('active');
            document.querySelector('.tab-content.active').classList.remove('active');
            
            tab.classList.add('active');
            const tabName = tab.dataset.tab;
            document.getElementById(`${tabName}-content`).classList.add('active');
        });
    });

    // Match card click
    document.addEventListener('click', (e) => {
        const matchCard = e.target.closest('.match-card');
        if (matchCard) {
            const matchId = parseInt(matchCard.dataset.matchId);
            const match = state.matches.find(m => m.id === matchId);
            if (match) {
                openMatchModal(match);
            }
        }
    });

    // Close modal
    document.querySelector('.close-modal')?.addEventListener('click', closeMatchModal);

    // Place bet button
    document.getElementById('place-bet-button')?.addEventListener('click', placeBetHandler);
}

// Open match modal
function openMatchModal(match) {
    const modal = document.getElementById('match-modal');
    const title = document.getElementById('modal-match-title');
    const teams = document.getElementById('modal-teams');
    const mainBets = document.getElementById('main-bets');
    const handicapBets = document.getElementById('handicap-bets');

    title.textContent = `${match.team1.name} vs ${match.team2.name}`;
    teams.innerHTML = `
        <div class="team left">
            <span class="team-name">${match.team1.name}</span>
        </div>
        <span class="vs">VS</span>
        <div class="team right">
            <span class="team-name">${match.team2.name}</span>
        </div>
    `;

    mainBets.innerHTML = match.mainBets.map((bet, index) => `
        <div class="bet-option" data-bet-type="main" data-bet-index="${index}">
            <div class="option-name">${bet.option}</div>
            <div class="option-odds">${bet.odds}x</div>
        </div>
    `).join('');

    handicapBets.innerHTML = match.handicapBets.map((bet, index) => `
        <div class="bet-option" data-bet-type="handicap" data-bet-index="${index}">
            <div class="option-name">${bet.option}</div>
            <div class="option-odds">${bet.odds}x</div>
        </div>
    `).join('');

    // Add event listeners to bet options
    document.querySelectorAll('.bet-option').forEach(option => {
        option.addEventListener('click', () => {
            document.querySelectorAll('.bet-option').forEach(opt => 
                opt.classList.remove('selected'));
            option.classList.add('selected');
        });
    });

    modal.style.display = 'flex';
}

// Close match modal
function closeMatchModal() {
    document.getElementById('match-modal').style.display = 'none';
}

// Place bet handler
function placeBetHandler() {
    const selectedOption = document.querySelector('.bet-option.selected');
    if (!selectedOption) {
        showNotification("Выберите вариант ставки", "error");
        return;
    }

    const betAmount = parseInt(document.getElementById('bet-amount').value);
    if (isNaN(betAmount) || betAmount < 10 || betAmount > state.balance) {
        showNotification("Введите корректную сумму ставки", "error");
        return;
    }

    const betType = selectedOption.dataset.betType;
    const betIndex = parseInt(selectedOption.dataset.betIndex);
    const matchTitle = document.getElementById('modal-match-title').textContent;
    
    let betOption, betOdds;
    const matchId = parseInt(document.querySelector('.match-card[data-match-id]').dataset.matchId);
    const match = state.matches.find(m => m.id === matchId);

    if (betType === 'main') {
        betOption = match.mainBets[betIndex].option;
        betOdds = match.mainBets[betIndex].odds;
    } else {
        betOption = match.handicapBets[betIndex].option;
        betOdds = match.handicapBets[betIndex].odds;
    }

    // Place the bet
    state.balance -= betAmount;
    state.bets.unshift({
        id: Date.now(),
        event: matchTitle,
        option: betOption,
        odds: betOdds,
        amount: betAmount,
        date: new Date().toLocaleString(),
        status: 'pending'
    });

    saveUserData();
    closeMatchModal();
    renderUI();
    showNotification(`Ставка ${betAmount} BOONT принята!`, "success");
    tg.HapticFeedback.impactOccurred('medium');
}

// Fetch real-time odds (simulated)
function fetchRealTimeOdds() {
    // In a real app, this would fetch from an API like Betfair
    state.matches.forEach(match => {
        match.mainBets.forEach(bet => {
            // Simulate small odds changes
            bet.odds = +(bet.odds + (Math.random() * 0.1 - 0.05)).toFixed(2);
        });
        match.handicapBets.forEach(bet => {
            bet.odds = +(bet.odds + (Math.random() * 0.1 - 0.05)).toFixed(2);
        });
    });
    
    renderMatches();
    
    // Update every 30 seconds
    setTimeout(fetchRealTimeOdds, 30000);
}

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    init();
    // Start real-time odds updates
    setTimeout(fetchRealTimeOdds, 30000);
});
