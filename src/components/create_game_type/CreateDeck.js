import React, { Component } from 'react';
import { range } from 'lodash';
import { Suits, CUSTOM_SUIT, RANK_ORDERS, HAND_SORT_ORDERS } from '../../utils/card';

import Hand from '../Hand';

class CreateDeck extends Component {

  constructor(props) {
    super(props);   // rankOrder, handSortOrder, onFinish (callback, takes the deck as an argument)
                    // onRankOrderChange (callback), onHandSortOrderChange (callback)
    this.state = {
      rankIncluded: Array(13).fill(true),
      customCards: []
    };
  }

  // includedRanks: array of ranks; contains duplicate entries when using multiple decks
  _getNonCustomCards(numSuits, includedRanks) {
    let cards = []
    range(numSuits).forEach(suit => {
      const moreCards = includedRanks.map(rank => {
        return {
          rank: rank,
          suit: suit
        };
      });
      cards = cards.concat(moreCards);
    });
    return cards;
  }

  _getCards(numSuits, numDecks) {
    let includedRanks = range(1, 14).filter(el => this.state.rankIncluded[el - 1]);
    if (numDecks > 1) {
      const singleDeckIncludedRanks = includedRanks.slice(0, includedRanks.length);
      while (includedRanks.length < numDecks * singleDeckIncludedRanks.length) {
        includedRanks = includedRanks.concat(singleDeckIncludedRanks);
      }
    }
    return this._getNonCustomCards(numSuits, includedRanks).concat(this.state.customCards);
  }

  onRankSelected(rankInd) {
    const { rankIncluded } = this.state;
    rankIncluded[rankInd] = !(rankIncluded[rankInd]);
    this.setState({ rankIncluded });
  }

  addCustomCardClicked() {
    const name = this.inputCustomCardName.value;
    if (name === '') {
      window.alert('must give custom card a name');
      return;
    }
    const rank = parseInt(this.inputCustomCardRank.value, 10);
    if (Number.isNaN(rank) || Math.abs(rank) > 99) {
      window.alert('invalid rank for custom card: ' + this.inputCustomCardRank.value);
      return;
    }
    const { customCards } = this.state;
    customCards.push({ name: name, rank: rank, suit: CUSTOM_SUIT });
    this.setState({ customCards });
  }

  finishClicked() {
    const numSuits = parseInt(this.inputNumSuits.value === '' ? 4 : this.inputNumSuits.value, 10);
    const numDecks = parseInt(this.inputNumDecks.value === '' ? 1 : this.inputNumDecks.value, 10);
    if (Number.isNaN(numSuits) || numSuits < 0) {
      window.alert('invalid number of suits: ' + this.inputNumSuits.value);
      return;
    }
    if (numSuits >= Object.keys(Suits).length) {
      window.alert('number of suits exceeds the max accepted.');
      return;
    }
    if (Number.isNaN(numDecks) || numDecks < 0 || numDecks > 10) {
      window.alert('invalid number of decks: ' + this.inputNumDecks.value);
      return;
    }
    this.props.onFinish(this._getCards(numSuits, numDecks));
  }

  renderNonCustomCardsInterface() {
    return (
      <div>
        <input type="text" ref={ el => this.inputNumSuits = el } placeholder="4" /> suits
        <br />
        Ranks to include:
        <Hand
          cards={ this._getNonCustomCards(1, range(1, 14)) }
          isYours={ true }
          visible={ true }
          onSelect={ this.onRankSelected.bind(this) }
          onPlayCards={ () => {} /* no-op */ }
          cardsSelected={ this.state.rankIncluded } />
        Number of decks: &nbsp;
        <input type="text" ref={ el => this.inputNumDecks = el } placeholder="1" />
      </div>
    );
  }

  renderCustomCardsInterface() {
    return (
      <div>
        Custom cards:
        <ul>
          <li>
            Custom card name (to be displayed on the card): &nbsp;
            <input type="text" ref={ el => this.inputCustomCardName = el } />
          </li>
          <li>
            Custom card value (for purposes of organizing hands only): &nbsp;
            <input type="text" ref={ el => this.inputCustomCardRank = el } />
          </li>
          <li>
            <button onClick={ this.addCustomCardClicked.bind(this) }>Add custom card</button>
          </li>
        </ul>
        { this.state.customCards.length } custom card(s) added so far:
        <ul>
          {
            this.state.customCards.map(
              (card, ind) =>
                <li key={ ind }>
                  { card.name + ' (' + card.rank + ')' }
                </li>
            )
          }
        </ul>
      </div>
    );
  }

  renderRankOrderInterface() {
    return (
      <div>
        Rank order: &nbsp;
          { RANK_ORDERS.map(
            (rankOrder, ind) => {
              return (
                <div key={ ind }>
                  <input
                    type="radio"
                    value={ rankOrder }
                    checked={ this.props.rankOrder === rankOrder }
                    onChange={ this.props.onRankOrderChange.bind(this) }
                  />{ rankOrder } &nbsp;
                </div>
              )
            }
          )
        }
      </div>
    );
  }

  renderHandSortOrderInterface() {
    return (
      <div>
        Hand sort order: &nbsp;
          { HAND_SORT_ORDERS.map(
            (sortOrder, ind) => {
              return (
                <div key={ ind }>
                  <input
                    type="radio"
                    value={ sortOrder }
                    checked={ this.props.handSortOrder === sortOrder }
                    onChange={ this.props.onHandSortOrderChange.bind(this) }
                  />{ sortOrder } &nbsp;
                </div>
              )
            }
          )
        }
      </div>
    );
  }

  render() {
    return (
      <div>
        First, create the deck.
        <br />
        { this.renderNonCustomCardsInterface() }
        { this.renderCustomCardsInterface() }
        { this.renderRankOrderInterface() }
        { this.renderHandSortOrderInterface() }
        <button onClick={ this.finishClicked.bind(this) }>Deck looks good!</button>
      </div>
    );
  }
}

export default CreateDeck;