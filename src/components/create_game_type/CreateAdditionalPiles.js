import React, { Component } from 'react';
import { range } from 'lodash';

import { HAND_DISPLAY_OPTIONS, DECK_NAME } from '../../utils/hand';

class CreateAdditionalPiles extends Component {

  constructor(props) {
    super(props);   // onFinish (callback, takes the additionalPiles as an argument)
    this.state = {
      piles: {
        0: {
          name: DECK_NAME,
          visible: false,
          displayMode: 'single'
        }
      }  // object mapping index to object (name, visible, displayMode)
    };
    this.nextPileInd = 1;
  }

  addPileClicked() {
    const { piles } = this.state;
    piles[this.nextPileInd] = {
      name: '',
      visible: true,
      displayMode: 'fan'
    }
    this.setState({ piles });
    this.nextPileInd++;
  }

	finishClicked() {
    const additionalPiles = [];
    range(this.nextPileInd).forEach((ind) =>
    {
      if (ind in this.state.piles) {
        additionalPiles.push(this.state.piles[ind]);
      }
    });
    this.props.onFinish(additionalPiles);
  }

  deletePileClicked(pileInd) {
    const { piles } = this.state;
    delete piles[pileInd];
    this.setState({ piles });
  }

  pileNameChanged(pileInd, e) {
    const { piles } = this.state;
    piles[pileInd].name = e.target.value;
    this.setState({ piles });
  }

  toggleVisibilityCheckbox(pileInd) {
    const { piles } = this.state;
    piles[pileInd].visible = !(piles[pileInd].visible);
    this.setState({ piles });
  }

  displayModeChanged(pileInd, e) {
    const { piles } = this.state;
    piles[pileInd].displayMode = e.target.value;
    this.setState({ piles });
  }

  renderPileInterface(pileInd, displayInd) {
    return (
      <div>
        Pile name: &nbsp;
        {
          displayInd === 1
          ? this.state.piles[0].name   // not allowed to rename the deck, to avoid confusion
                                       // from people trying to repurpose it
          : <input
              type="text"
              onChange={ (e) => this.pileNameChanged(pileInd, e) }
              value={ this.state.piles[pileInd].name } />
        }
        <br />

        Visible to players: &nbsp;
        <input
          type="checkbox"
          checked={ this.state.piles[pileInd].visible }
          onChange={ () => this.toggleVisibilityCheckbox(pileInd) } />
        <br />

        Display style: &nbsp;
        { HAND_DISPLAY_OPTIONS.map(
          (option, ind) => {
            return (
              <div key={ ind }>
                { option } &nbsp;
                <input
                  type="radio"
                  value={ option }
                  checked={ this.state.piles[pileInd].displayMode === option }
                  onChange={ (e) => this.displayModeChanged(pileInd, e) }
                />
              </div>
            )
          }
        )}

        {
          displayInd === 1
          ? null   // not allowed to delete the deck
          : <button onClick={ () => this.deletePileClicked(pileInd) }>Delete pile</button>
        }
      </div>
    );
  }

  render() {
    return (
      <div>
        By default, all games will have a deck that players can interact with (e.g., draw from or play onto).
        If you'd like to create more such piles, like a discard pile or specialized stacks to play onto, let's do that now.
        <br />
        <br />
        Included piles:
        <ul>
          {
            Object.keys(this.state.piles).map(
              (key, ind) => {
                return (
                  <li key={ ind }>
                    { this.renderPileInterface(key, ind + 1) }
                  </li>
                );
              }
            )
          }
        </ul>
        <button onClick={ this.addPileClicked.bind(this) }>Add new pile</button>
        <br />
        <button onClick={ this.finishClicked.bind(this) }>Done adding piles</button>
      </div>
    );
  }
}

export default CreateAdditionalPiles;