import { range } from 'lodash';

export const Suits = {
  0: {
    'name': 'spade',
    'displayName': 'S',
    'imageUrl': './../images/spade.png'
  },
  1: {
    'name': 'heart',
    'displayName': 'H',
    'imageUrl': './../images/heart.png'
  },
  2: {
    'name': 'club',
    'displayName': 'C',
    'imageUrl': './../images/club.png'
  },
  3: {
    'name': 'diamond',
    'displayName': 'D',
    'imageUrl': './../images/diamond.png'
  },
  4: {
    'name': 'custom',
    'displayName': 'custom',
    'imageUrl': ''    // TODO: FIX
  }
};
export const CUSTOM_SUIT = 4;

export const rankToSymbol = {
  1: 'A',
  2: 2,
  3: 3,
  4: 4,
  5: 5,
  6: 6,
  7: 7,
  8: 8,
  9: 9,
  10: 10,
  11: 'J',
  12: 'Q',
  13: 'K'
};

export const getStandardDeck = () => {
  const standardDeck = [];
  range(4).forEach(suit => {
    range(1, 14).forEach(rank => {
      const card = {
        suit: suit,
        rank: rank
      }
      standardDeck.push(card);
    });
  });
  return standardDeck;
};