import React, { Component } from 'react';
import { Suits, rankToSymbol } from '../utils/card';

const imageUrls = {
  'spade': require('./../images/spade.png'),
  'heart': require('./../images/heart.png'),
  'club': require('./../images/club.png'),
  'diamond': require('./../images/diamond.png')
}

class Card extends Component {

  constructor(props) {
    super(props); // card: { suit, rank}, visible, selected, keyBinding
  }

  renderVisibleCard() {
    const { card } = this.props;
    const suit = Suits[card.suit];
    return (
      <div className="card">
        <img src={ imageUrls[suit.name] } 
             alt={ suit.name } 
             style={ {'width': '15px', 
                      'height': '15px', 
                      'margin-bottom': '-2px'} } />
        &nbsp;
        { rankToSymbol[card.rank] }
        &nbsp;
        { this.props.keyBinding ? '(' + this.props.keyBinding + ')' : null }
        &nbsp;
        { this.props.selected ? 'selected!' : null }
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