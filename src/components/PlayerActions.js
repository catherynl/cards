import React, { Component } from 'react';
import KeyHandler from 'react-key-handler';
import { range } from 'lodash';

import {
  PLAYER_ACTION_MAP,
  PASS_CARDS_INDEX,
  DRAW_CARDS_INDEX,
  UNDO_PLAY_INDEX,
  DISCARD_CARDS_INDEX
} from '../utils/stage';
import {
  DECK_INDEX,
  RECENTLY_PLAYED_INDEX
} from '../utils/magic_numbers';

class PlayerActions extends Component {

  // props:
  // gameState, gameType, playerIndex
  // secondPhaseAction, selectedTargets, numCardsToActOn, validPileIndsToDrawFrom
  // recordTargetSelection, updateNumCardsToActOn, onCancelAction, enterPressed (callbacks)
  // onPlayerAction (callback, takes actionInd)

  _getNumPlayers() {
    return this.props.gameState.players.length;
  }

  _getCurrentStage() {
    return this.props.gameState.currentStage;
  }

  _haveRecentlyPlayed() {
    if (this.props.gameState.hands[RECENTLY_PLAYED_INDEX + this.props.playerIndex].cards) {
      return true;
    } else {
      return false;
    }
  }

  renderTargetChoices(targets, displayNameFunc) {
    return (
      <div>
        {
          targets
            .map((target, i) => {
              return (
                <div key={ i }>
                  <input
                    type="radio"
                    value={ target }
                    checked={ this.props.selectedTargets[0] === target }
                    onChange={ () => this.props.recordTargetSelection(0, target) }
                  />
                  { displayNameFunc(target) }
                </div>);
            })
        }
      </div>
    );
  }

  renderPileChoices(pileInds) {
    const displayNameFunc = (pileInd) => {
      return this.props.gameState.hands[pileInd].name + ' (Stack id: ' + pileInd + ')';
    }
    return this.renderTargetChoices(pileInds, displayNameFunc);
  }

  renderSecondPhaseAction(actionInd) {
    switch (actionInd) {
      case PASS_CARDS_INDEX:
        return (
          <div>
            Which player are you passing to?
            { this.renderTargetChoices(
                range(this._getNumPlayers())
                  .filter(i => i !== this.props.playerIndex),
                (i) => 'Player ' + (i + 1)
              )}
          </div>
        );
      case DRAW_CARDS_INDEX:
        return (
          <div>
            Which pile are you drawing from?
            { this.renderPileChoices(this.props.validPileIndsToDrawFrom) }
            How many cards would you like to draw? &nbsp;
            <input
              type="text"
              value={ this.props.numCardsToActOn }
              onChange={ this.props.updateNumCardsToActOn.bind(this) }
              placeholder="1" />
          </div>
        );
      case DISCARD_CARDS_INDEX:
        return (
          <div>
            Which pile are you discarding to?
            { this.renderPileChoices(
                Object.keys(this.props.gameState.hands)
                  .filter(i => i >= DECK_INDEX)) }
          </div>
        );
      default:
        console.log('ERROR. invalid type of action passed to renderSecondPhaseAction.');
    }
  }

  renderCancelAction() {
    return (
      <button onClick={ this.props.onCancelAction.bind(this) }>Cancel</button>
    );
  }

  render() {
    return (
      <div className='player-actions'>
        {
          range(Object.keys(PLAYER_ACTION_MAP).length)    // forces i to be a Number, not a string
            .filter(i => this.props.gameType.getActionInStage(this._getCurrentStage(), i))
            .map(i => {
              const action = PLAYER_ACTION_MAP[i];
              const {displayName} = action;
              const onClick = () => this.props.onPlayerAction(i);
              if (this.props.secondPhaseAction === -1) {
                if (i === UNDO_PLAY_INDEX && !this._haveRecentlyPlayed()) {
                  return null; // only display "Undo play" button if recently played
                }
                return <button key={i} onClick={onClick}>{displayName}</button>;
              } else {
                if (this.props.secondPhaseAction === i) {
                  return (
                    <div key={i}>
                      { this.renderSecondPhaseAction(i) }
                      <button onClick={onClick}>Confirm {displayName}</button>
                    </div>
                  )
                } else {
                  return null;   // don't display actions other than the one waiting for confirmation
                }
              }
            })
        }
        { this.props.secondPhaseAction !== -1 ? this.renderCancelAction() : null }
        <KeyHandler keyEventName="keydown" keyValue="Enter" onKeyHandle={ this.props.enterPressed.bind(this) } />
      </div>
    );
  }
}

export default PlayerActions;