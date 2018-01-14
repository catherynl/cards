import React, { Component } from 'react';
import Card from './Card';
import { range } from 'lodash';

const SuitEnum = {
  SPADE: 0,
  HEART: 1,
  CLUB: 2,
  DIAMOND: 3
};

const RANKS = 13;

class Deck extends Component {

  constructor(props) {
    super(props);
    this.state = {
      cards: []
    };
    this.initializeCards();
    this.shuffle();
  }

  initializeCards() {
    range(RANKS).forEach(rank => {
      Object.keys(SuitEnum).forEach(suit => {
        let card = {
          rank: rank + 1,
          suit: suit
        }
        this.state.cards.push(card);
      });
    });
  }

  getCards() {
    return this.state.cards;
  }

  shuffle() {
    const { cards } = this.state;
    for (var i = cards.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var temp = cards[i];
      cards[i] = cards[j];
      cards[j] = temp;
    }
  }

  deal(numPlayers) {
    const { cards } = this.state;
    const hands = range(numPlayers).map(i => []);
    range(cards.length).forEach(i => {
      hands[i % numPlayers].push(cards[i]);
    });
    return hands;
  }

  render() {
    return (
      <div>
        { this.state.cards.map((card, index) => <Card key={ index } card={ card } /> ) }
      </div>
    );
  }
}

export default Deck;