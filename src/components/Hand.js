import React, { Component } from 'react';
import KeyHandler from 'react-key-handler';
import { range } from 'lodash';

import Card from './Card';

const KEYS = Array.of('q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p', 'a', 's', 'd',
                      'f', 'g', 'h', 'j', 'k', 'l', 'z', 'x', 'c', 'v', 'b', 'n', 'm',
                      'Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P', 'A', 'S', 'D',
                      'F', 'G', 'H', 'J', 'K', 'L', 'Z', 'X', 'C', 'V', 'B', 'N', 'M',
                      '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '!', '@', '#',
                      '$', '%', '^', '&', '*', '(', ')');

class Hand extends Component {

    // props:
    // cards [], cardsSelected, isActionable (boolean), visible (boolean),
    // onSelect (callback that takes cardIndex)

  _getKeyBinding(cardIndex) {
    return KEYS[cardIndex];
  }

  _getCardSelected(cardIndex) {
    return this.props.cardsSelected ? this.props.cardsSelected[cardIndex] : false;
  }

  recordKeyPress(keyValue) {
    const keyInd = KEYS.indexOf(keyValue);
    if (keyInd >= 0 && keyInd < this.props.cards.length) {
      this.props.onSelect(keyInd);
    }
  }

  renderCard(index, showStackSize) {
    const card = this.props.cards[index];
    if (this.props.isActionable) {
      return (<Card
        key={ index }
        card={ card }
        visible={ this.props.visible }
        newlyObtained={ card.newlyObtained }
        selected={ this._getCardSelected(index) }
        showStackSize={ showStackSize }
        stackSize={ this.props.cards.length }
        keyBinding={ this._getKeyBinding(index) }/>
      );
    } else {
      return (<Card
        key={ index }
        card={ card }
        visible={ this.props.visible }
        newlyObtained={ card.newlyObtained }
        selected={ this._getCardSelected(index) }
        showStackSize={ showStackSize }
        stackSize={ this.props.cards.length }/>
      );
    }
  }

  renderKeyListeners() {
    return (
      <div>
        { range(Math.min(this.props.cards.length, KEYS.length)).map(ind =>
          <KeyHandler key={ ind } keyEventName="keydown" keyValue={ this._getKeyBinding(ind) } onKeyHandle={() => this.recordKeyPress(this._getKeyBinding(ind))} />
        )}
      </div>
    );
  }

  renderCards() {
    const lastIndex = this.props.cards.length - 1;
    if (!this.props.visible) {
      return this.renderCard(lastIndex, true);
    }
    switch (this.props.displayMode) {
      case 'fan':
        return this.props.cards.map((card, index) => this.renderCard(index, false));
      case 'single':
        return this.renderCard(lastIndex, true);
      default:
        console.log('tried to render', this.props.cards)
        console.log('unrecognized hand display mode');
    }
  }

  renderEmptyHand() {
    return (<Card isEmpty={ true }/>);
  }

  render() {
    return (
      <div>
        { this.props.isActionable ? this.renderKeyListeners() : null }
        <div className="cards">
          { this.props.cards.length > 0
            ? this.renderCards()
            : this.renderEmptyHand() }
        </div>
      </div>
    );
  }
}

export default Hand;