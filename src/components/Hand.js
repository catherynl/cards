import React, { Component } from 'react';
import KeyHandler from 'react-key-handler';
import { range } from 'lodash';

import Card from './Card';

const KEYS = Array.of('q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p', 'a', 's', 'd',
                      'f', 'g', 'h', 'j', 'k', 'l', 'z', 'x', 'c', 'v', 'b', 'n', 'm',
                      'Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P', 'A', 'S', 'D',
                      'F', 'G', 'H', 'J', 'K', 'L', 'Z', 'X', 'C', 'V', 'B', 'N', 'M');

class Hand extends Component {

  constructor(props) {
    super(props); // cards [], cardsSelected, isYours (boolean), visible (boolean),
                  // onSelect (callback that takes cardIndex), onPlayCards (callback)
  }

  _getKeyBinding(cardIndex) {
    return KEYS[cardIndex];
  }

  _getCardSelected(cardIndex) {
    return this.props.cardsSelected ? this.props.cardsSelected[cardIndex] : false;
  }

  recordKeyPress(keyValue) {
    if (keyValue === 'Enter') {
      this.props.onPlayCards();
      return;
    }
    const keyInd = KEYS.indexOf(keyValue);
    if (keyInd >= 0 && keyInd < this.props.cards.length) {
      this.props.onSelect(keyInd);
    }
  }

  renderCard(card, index) {
    if (this.props.isYours) {
      return (<Card
        key={ index }
        card={ card }
        visible={ this.props.visible }
        selected={this._getCardSelected(index)}
        keyBinding={this._getKeyBinding(index)}/>
      );
    } else {
      return (<Card
        key={ index }
        card={ card }
        visible={ this.props.visible }
        selected={this._getCardSelected(index)}/>
      );
    }
  }

  renderKeyListeners() {
    return (
      <div>
        { range(this.props.cards.length).map(ind =>
          <KeyHandler key={ ind } keyEventName="keydown" keyValue={ this._getKeyBinding(ind) } onKeyHandle={() => this.recordKeyPress(this._getKeyBinding(ind))} />
        )}
        <KeyHandler keyEventName="keydown" keyValue="Enter" onKeyHandle={() => this.recordKeyPress("Enter")} />
      </div>
    );
  }

  render() {
    return (
      <div>
        { this.props.isYours ? this.renderKeyListeners() : null }
        <div className="cards">
          { this.props.cards.map((card, index) => this.renderCard(card, index)) }
        </div>
      </div>
    );
  }
}

export default Hand;