export const actionMap = {
  0: {
    name: 'playCards',
    displayName: 'Play cards'
  },
  1: {
    name: 'drawCards',
    displayName: 'Draw cards'
  },
  2: {
    name: 'passCards',
    displayName: 'Pass cards'
  },
  3: {
    name: 'endTurn',
    displayName: 'End turn (Enter)'
  },
  4: {
    name: 'dealCards',
    displayName: 'Deal cards'
  },
  5: {
    name: 'confirmTrade',
    displayName: 'Confirm trade'
  },
  6: {
    name: 'revealCards',
    displayName: 'Reveal cards'
  }
};
export const PLAY_CARDS_INDEX = 0;
export const END_TURN_INDEX = 3;

export const STAGES = {
  0: {
    name: 'deal',
    displayName: 'Deal stage',
    defaultActions: [false, false, false, false, true, false, false],
    availableActions: false
  },
  1: {
    name: 'play',
    displayName: 'Play stage',
    defaultActions: [true, false, false, true, false, false, false],
    availableActions: [0, 1, 2, 3, 6]
  },
  2: {
    name: 'trade',
    displayName: 'Trade stage',
    defaultActions: [false, false, true, true, false, true, false],
    availableActions: [2, 6]
  },
  3: {
    name: 'buffer',
    displayName: 'Buffer stage',
    defaultActions: [false, false, false, false, false, false, false],
    availableActions: false
  }
};

// during a deal stage, after dealing a fixed number of cards to each player
// options for handling the remaining cards
export const HANDLE_REMAINING = ['keepInDeck', 'dealOut'];

// during a play stage, options for determining whose turn is next
export const NEXT_PLAYER = ['cycle', 'trickTaking'];
