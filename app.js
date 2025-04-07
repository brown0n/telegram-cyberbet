const API_URL = 'https://api.oddspedia.com/v1/odds';
const API_KEY = 'a15f716d0a5fd971ce57ea00be55506f';

async function fetchOdds() {
    try {
        const response = await fetch(`${API_URL}?apikey=${API_KEY}`);
        const data = await response.json();
        updateOdds(data);
    } catch (error) {
        console.error('Ошибка при получении коэффициентов:', error);
    }
}

function updateOdds(data) {
    state.matches.forEach(match => {
        const matchOdds = data.odds.find(odds => odds.match_id === match.id);
        if (matchOdds) {
            match.mainBets.forEach(bet => {
                const newOdd = matchOdds[bet.option];
                if (newOdd) bet.odds = newOdd;
            });
            match.handicapBets.forEach(bet => {
                const newOdd = matchOdds[bet.option];
                if (newOdd) bet.odds = newOdd;
            });
        }
    });
    renderMatches();
}

setInterval(fetchOdds, 30000);

document.addEventListener('DOMContentLoaded', fetchOdds);

