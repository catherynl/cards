import React, { Component } from 'react';
import { range } from 'lodash';

class CreateDeck extends Component {

  constructor(props) {
    super(props);
    this.state = {
      numSuits: 4,
      includedRanks: range(1, 14),  // contains duplicate entries when using multiple decks
      customCards: []
    };
  }

  _getNonCustomCards() {
    let cards = []
    range(this.state.numSuits).forEach(suit => {
      const moreCards = this.state.includedRanks.map(rank => {
        return {
          rank: rank,
          suit: suit
        };
      });
      cards = cards.concat(moreCards);
    });
    return cards;
  }

  getCards() {
    return this._getNonCustomCards().concat(this.state.customCards);
  }

  render() {
    return (
      <div>(TODO: create deck interface here)</div>
    );
  }
}

export default CreateDeck;