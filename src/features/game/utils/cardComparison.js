export const getMoreExpensiveCardIndex = (card1, card2) => {
  const price1 = parseFloat(card1.prices.eur);
  const price2 = parseFloat(card2.prices.eur);
  
  return price1 >= price2 ? 0 : 1;
};

export const isChoiceCorrect = (chosenIndex, card1, card2) => {
  const price1 = parseFloat(card1.prices.eur);
  const price2 = parseFloat(card2.prices.eur);
  
  // Wenn beide Karten gleich teuer sind, ist jede Wahl korrekt
  if (price1 === price2) {
    return true;
  }
  
  // Ansonsten normale Logik
  const correctIndex = getMoreExpensiveCardIndex(card1, card2);
  return chosenIndex === correctIndex;
};

export const formatPrice = (price) => {
  return `€${parseFloat(price).toFixed(2)}`;
};

export const getMoreExpensiveCard = (card1, card2) => {
  const index = getMoreExpensiveCardIndex(card1, card2);
  return index === 0 ? card1 : card2;
};

export const createErrorMessage = (correctCard) => {
  return `❌ Wrong! ${correctCard.name} (${correctCard.set}) was more expensive: ${formatPrice(correctCard.prices.eur)}`;
};