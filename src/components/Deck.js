import React, { Component } from 'react';
import Card from './Card';
import { range } from 'lodash';
import { Suits } from '../utils/card';

const RANKS = 13;

class Deck extends Component {

  constructor(props) {
    super(props);  // cards (array of cards)
  }

  getCards() {
    return this.props.cards;
  }

  shuffle() {
    const { cards } = this.props;
    for (var i = cards.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var temp = cards[i];
      cards[i] = cards[j];
      cards[j] = temp;
    }
    return cards;
  }

  // TODO: generalize this to allow other sorting orders
  cardComparison(card1, card2) {
    return this.cardValue(card1) - this.cardValue(card2);
  }
  cardValue(card) {
    return card.suit * 100 + card.rank;
  }
  // hands.forEach(hand => {hand.sort(this.cardComparison.bind(this))});

  // deal out all cards into <numPlayers> unsorted hands.
  deal(numPlayers) {
    const { cards } = this.props;
    const hands = range(numPlayers).map(i => []);
    range(cards.length).forEach(i => {
      hands[i % numPlayers].push(cards[i]);
    });
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