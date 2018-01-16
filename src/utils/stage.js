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
    displayName: 'End turn'
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

export const STAGES = {
  0: {
    name: 'deal',
    displayName: 'Deal stage',
    defaultActions: [false, false, false, false, true, false, false]
  },
  1: {
    name: 'play',
    displayName: 'Play stage',
    defaultActions: [true, false, false, true, false, false, false]
  }
};

// during a deal stage, after dealing a fixed number of cards to each player
// options for handling the remaining cards
export const HANDLE_REMAINING = ['keepInDeck', 'dealOut'];

// during a play stage, options for determining whose turn is next
export const NEXT_PLAYER = ['cycle', 'trickTaking'];
