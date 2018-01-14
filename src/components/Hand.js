import React, { Component } from 'react';
import Card from './Card';

class Hand extends Component {

  constructor(props) {
    super(props); // cards [], visible (boolean)
  }

  render() {
    return (
      <div>
        { this.props.cards.map((card, index) =>
          <Card key={ index } card={ card } visible={ this.props.visible }/> ) }
      </div>
    );
  }
}

export default Hand;