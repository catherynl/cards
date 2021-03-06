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
    'name': 'star',
    'displayName': 'T',
    'imageUrl': './../images/star.png'
  },
  5: {
    'name': 'moon',
    'displayName': 'M',
    'imageUrl': './../images/moon.png'
  },
  6: {
    'name': 'custom',
    'displayName': 'custom',
    'imageUrl': ''
  }
};
export const CUSTOM_SUIT = 6;
export const MAX_NUM_SUITS = Object.keys(Suits).length - 1;

export const RANK_ORDERS = ['K-high', 'A-high', '2-high'];
export const HAND_SORT_ORDERS = ['suitFirst', 'rankFirst'];

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
