document.addEventListener("DOMContentLoaded", function () {
    const sidebar = document.querySelector(".sidebar");
    const toggleButton = document.createElement("button");
    toggleButton.classList.add("toggle-button");
    toggleButton.textContent = "☰";
    sidebar.appendChild(toggleButton);

    toggleButton.addEventListener("click", function () {
        sidebar.classList.toggle("active");
        document.querySelector(".main-content").classList.toggle("sidebar-open");
    });
});
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
        name: "BLAST Premier Fall Groups 2024",
        dates: "15-21 июля 2024",
        prize: "$177,498"
    },
    matches: []
};

// Initialize the app
async function init() {
    tg.expand();
    tg.setHeaderColor('#2E4F4F');
    tg.setBackgroundColor('#f5f5f5');
    
    await loadUserData();
    setupEventListeners();
    renderUI();
    
    // Fetch matches and odds from API
    fetchMatchesFromAPI();
    
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

// Fetch matches from API
async function fetchMatchesFromAPI() {
    try {
        const response = await fetch('https://your-api-endpoint.com/matches'); // Replace with your API endpoint
        if (!response.ok) {
            throw new Error('Failed to fetch match data');
        }
        const data = await response.json();
        updateMatches(data);  // Update matches in state
    } catch (error) {
        console.error("Error fetching matches:", error);
    }
}

// Update matches with fetched data
function updateMatches(matches) {
    state.matches = matches.map(match => ({
        ...match,
        mainBets: match.mainBets.map(bet => ({
            ...bet,
            odds: parseFloat(bet.odds.toFixed(2)) // Normalize odds
        })),
        handicapBets: match.handicapBets.map(bet => ({
            ...bet,
            odds: parseFloat(bet.odds.toFixed(2)) // Normalize odds
        }))
    }));
    renderMatches();  // Update UI with the new matches
}

// Check for daily bonus
function checkDailyBonus() {
    const today = new Date().toDateString();
    if (state.lastBonusDate !== today) {
        state.balance += 500;
        state.lastBonusDate = today;
        saveUserData();
        updateUI();
        showNotification("🎉 Daily Bonus +500 BOONT!", "success");
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
            <p class="tournament-prize">Prize Fund: ${state.currentTournament.prize}</p>
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
        betsList.innerHTML = '<p>No bets placed yet</p>';
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
                ${bet.status === 'won' ? '✅ Win' : 
                  bet.status === 'lost' ? '❌ Loss' : '🔄 Pending'}
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
async function placeBetHandler() {
    const selectedOption = document.querySelector('.bet-option.selected');
    if (!selectedOption) {
        showNotification("Select a bet option", "error");
        return;
    }

    const betAmount = parseInt(document.getElementById('bet-amount').value);
    if (isNaN(betAmount) || betAmount < 10 || betAmount > state.balance) {
        showNotification("Enter a valid bet amount", "error");
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

    const betData = {
        amount: betAmount,
        event: matchTitle,
        option: betOption,
        odds: betOdds
    };

    // Place the bet on API
    try {
        const response = await fetch('https://your-api-endpoint.com/place-bet', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(betData)
        });

        const result = await response.json();
        if (result.success) {
            state.balance -= betAmount;
            state.bets.unshift(result.bet);
            saveUserData();
            closeMatchModal();
            renderUI();
            showNotification(`Bet of ${betAmount} BOONT accepted!`, "success");
            tg.HapticFeedback.impactOccurred('medium');
        } else {
            showNotification("Error placing bet", "error");
        }
    } catch (error) {
        showNotification("Error placing bet", "error");
        console.error("Error:", error);
    }
}

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    init();
});
