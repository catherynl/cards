export const HAND_DISPLAY_OPTIONS = ['single', 'fan'];

export const DECK_NAME = 'Deck';

export const shuffleHand = (cards) =>
{
  for (var i = cards.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var temp = cards[i];
    cards[i] = cards[j];
    cards[j] = temp;
  }
  return cards;
};