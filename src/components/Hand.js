import React, { Component } from 'react';
import KeyHandler from 'react-key-handler';
import { range } from 'lodash';

import Card from './Card';

const KEYS = Array.of('q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p', 'a', 's', 'd', 'f',
                        'g', 'h', 'j', 'k', 'l', 'z', 'x', 'c', 'v', 'b', 'n', 'm');

class Hand extends Component {

  constructor(props) {
    super(props); // cards [], isYours (boolean), visible (boolean)
    this.state = {
      cardsSelected: Array(this.props.cards.length).fill(false)
    };
  }

  _getKeyBinding(card_index) {
    return KEYS[card_index];
  }

  componentWillReceiveProps(newProps) {
    const newLength = newProps.cards.length;
    const oldLength = this.state.cardsSelected.length;
    if (newLength !== oldLength) {
      const cardsSelected = newLength > oldLength ?
        this.state.cardsSelected.concat(Array(newLength - oldLength).fill(false)) :
        this.state.cardsSelected.slice(0, newLength);

      this.setState({cardsSelected});
    }
  }

  recordKeyPress(keyValue) {
    const keyInd = KEYS.indexOf(keyValue);
    if (keyInd >= 0 && keyInd < this.props.cards.length) {
      let { cardsSelected } = this.state;
      cardsSelected[keyInd] = !(cardsSelected[keyInd]);
      this.setState({ cardsSelected });
    }
  }

  renderKeyListeners() {
    return (
      <div>
        { range(this.props.cards.length).map(ind =>
          <KeyHandler key={ ind } keyEventName="keydown" keyValue={ this._getKeyBinding(ind) } onKeyHandle={() => this.recordKeyPress(this._getKeyBinding(ind))} />
        )}
      </div>
    );
  }

  render() {
    return (
      <div>
        { this.props.isYours ? this.renderKeyListeners() : null }
        { this.props.cards.map((card, index) =>
          <Card key={ index } card={ card } visible={ this.props.visible } selected={this.state.cardsSelected[index]} keyBinding={this._getKeyBinding(index)}/> ) }
        }
      </div>
    );
  }
}

export default Hand;