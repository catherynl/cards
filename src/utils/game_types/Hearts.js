import { range } from 'lodash';

const getStandardDeck = () => {
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

export const TestHearts = {
    deck: getStandardDeck(),
    handSortOrder: 'suitFirst',
    maxPlayers: 4,
    minPlayers: 1,
    name: 'Test Hearts',
    numPlayers: 4,
    rankOrder: 'A-high',
    stages: [
        {
            name: 'Deal Stage',
            type: 'deal',
            dealCountPerPlayer: 13,
            handleRemaining: 'keepInDeck',
            availableActions: [false, false, false, false, true]
        },
        {
            name: 'Play Stage',
            type: 'play',
            nextPlayerRules: 'trickTaking',
            availableActions: [true, false, false, true, false]
        }
    ]
};

export const TestHearts2 = {
    deck: getStandardDeck(),
    handSortOrder: 'suitFirst',
    maxPlayers: 4,
    minPlayers: 1,
    name: 'Test Hearts',
    numPlayers: 4,
    rankOrder: 'A-high',
    stages: [
        {
            name: 'Deal Stage',
            type: 'deal',
            dealCountPerPlayer: 13,
            handleRemaining: 'keepInDeck',
            availableActions: [false, false, false, false, true, false]
        },
        {
            name: 'Trade Stage',
            type: 'trade',
            availableActions: [false, false, true, true, false, true]
        },
        {
            name: 'Play Stage',
            type: 'play',
            nextPlayerRules: 'trickTaking',
            availableActions: [true, false, false, true, false, false]
        }
    ]
};