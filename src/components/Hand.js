import React, { Component } from 'react';
import Card from './Card';

class Hand extends Component {

  constructor(props) {
    super(props); // list of cards
  }

  render() {
    return (
      <div>
        { this.props.cards.map((card, index) => <Card key={ index } card={ card } /> ) }
      </div>
    );
  }
}

export default Hand;