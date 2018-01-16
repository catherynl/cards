import React, { Component } from 'react';
import { Suits, rankToSymbol, CUSTOM_SUIT } from '../utils/card';

const imageUrls = {
  'spade': require('./../images/spade.png'),
  'heart': require('./../images/heart.png'),
  'club': require('./../images/club.png'),
  'diamond': require('./../images/diamond.png'),
  'star': require('./../images/star.png'),
  'moon': require('./../images/moon.png')
};

class Card extends Component {

  // props: card: { suit, rank}, visible, selected, keyBinding

  renderVisibleCard() {
    const { card } = this.props;
    const suit = Suits[card.suit];
    return (
      <div className='card-outer'>
        <div className={this.props.selected ? 'card selected' : 'card'}>
          { Object.keys(imageUrls).includes(suit.name)
            ? <span>
                <img src={ imageUrls[suit.name] }
                  alt={ suit.name }
                  style={ {'width': '15px',
                           'height': '15px',
                           'marginBottom': '-2px'} } />
                &nbsp;
              </span>
            : null }
          { card.suit === CUSTOM_SUIT ? card.name : rankToSymbol[card.rank] }
        </div>
        <div className='card-key-binding'>
          { this.props.keyBinding ? '(' + this.props.keyBinding + ')' : null }
        </div>
      </div>
    );
  }

  renderHiddenCard() {
    return (<div className='card hidden'>?</div>)
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