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
    super(props); // card: { suit, rank}, visible
  }

  renderVisibleCard() {
    const { card } = this.props;
    return (
      <div>
        { card.suit } { rankToSymbol[card.rank] }
      </div>
    );
  }

  renderHiddenCard() {
    return (<div>Hidden</div>)
  }

  render() {
    return (
      <div>
        { this.props.visible
          ? this.renderVisibleCard()
          : this.renderHiddenCard()
        }
      </div>
    );
  }
}

export default Card;