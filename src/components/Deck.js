import React, { Component } from 'react';
import Card from './Card';
import { range } from 'lodash';

class Deck extends Component {

  constructor(props) {
    super(props);  // cards (array of cards)
  }

  getCards() {
    return this.props.cards;
  }

  _shuffle() {
    const { cards } = this.props;
    for (var i = cards.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var temp = cards[i];
      cards[i] = cards[j];
      cards[j] = temp;
    }
    return cards;
  }

  // deal out all cards into <numPlayers> unsorted hands.
  deal(numPlayers) {
    const cards = this._shuffle();
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