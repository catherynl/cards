import React, { Component } from 'react';
import { range } from 'lodash';

import Card from './Card';
import { DECK_INDEX } from '../utils/magic_numbers';
import { shuffleHand, DECK_NAME } from '../utils/hand';

class Deck extends Component {

  // props: cards (array of cards), displayMode, visible

  getCards() {
    return this.props.cards;
  }

  _shuffle() {
    return shuffleHand(this.props.cards);
  }

  // deal out all cards into <numPlayers> unsorted hands.
  deal(numPlayers, dealCountPerPlayer, handleRemaining) {
    const usedCards = numPlayers * dealCountPerPlayer;
    const deckCards = this._shuffle();
    const hands = {}
    range(numPlayers).forEach(i => {
      hands[i] = {
        cards: [],
        displayMode: 'fan',
        visibility: range(numPlayers).map(j => i === j)
      };
    });
    range(usedCards).forEach(i => {
      hands[i % numPlayers].cards.push(deckCards[i]);
    });

    // if there are remaining cards
    if (usedCards < deckCards.length) {
      switch (handleRemaining) {
        case 'keepInDeck':
          const deck = {
            name: DECK_NAME,
            cards: deckCards.slice(usedCards),
            displayMode: this.props.displayMode,
            visibility: Array(numPlayers).fill(this.props.visible)
          };
          hands[DECK_INDEX] = deck;
          break;
        case 'dealOut':
          range(usedCards, deckCards.length).forEach(i => {
            hands[i % numPlayers].cards.push(deckCards[i]);
          });
          break;
        default:
          console.log('unrecognized handleRemaining option');
      }
    }
    return hands;
  }

  render() {
    return (
      <div>
        { this.props.cards.map((card, index) => <Card key={ index } card={ card } /> ) }
      </div>
    );
  }
}

export default Deck;