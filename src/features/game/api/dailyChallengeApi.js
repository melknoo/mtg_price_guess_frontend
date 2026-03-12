import apiClient from '../../../api/axios';

/**
 * Lädt den täglichen Kartenpool vom Server.
 * Gibt { already_played, challenge_date, cards?, score?, rank? } zurück.
 */
export const fetchDailyChallengeCards = async () => {
  const response = await apiClient.get('/api/daily-challenge/cards');

  if (response.data.already_played) {
    return {
      already_played: true,
      score: response.data.score,
      rank: response.data.rank,
      challenge_date: response.data.challenge_date,
    };
  }

  // Transformiere Cards ins gleiche Format wie fetchRandomCards
  const cards = response.data.cards.map(card => ({
    id: card.id,
    name: card.name,
    set: card.set,
    prices: { eur: parseFloat(card.price) },
    image_uris: { normal: card.image },
    color: card.color,
    cmc: card.cmc,
    border_color: card.border_color,
    rarity: card.rarity,
  }));

  return {
    already_played: false,
    challenge_date: response.data.challenge_date,
    cards,
  };
};

/**
 * Speichert den Final-Score des heutigen Daily Challenges.
 * Gibt { success, rank, score } zurück.
 */
export const saveDailyChallengeScore = async (score) => {
  const response = await apiClient.post('/api/daily-challenge/score', { score });
  return response.data;
};

/**
 * Lädt das heutige Daily Challenge Leaderboard.
 * Gibt { success, challenge_date, total_players, data: [{rank, username, score}] } zurück.
 */
export const fetchDailyChallengeLeaderboard = async () => {
  const response = await apiClient.get('/api/daily-challenge/leaderboard');
  return response.data;
};
