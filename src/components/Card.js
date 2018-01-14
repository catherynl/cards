import React, { Component } from 'react';

const rankToSymbol = {
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
}

class Card extends Component {

  constructor(props) {
    super(props); // card: { suit, rank }
  }

  render() {
    const { card } = this.props;
    return (
      <div>
        Suit: { card.suit } Rank: { rankToSymbol[card.rank] }
      </div>
    );
  }
}

export default Card;