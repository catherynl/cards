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

  renderPileChoices(pileInds) {
    return (
      <div>
        {
          pileInds
            .map((handInd, i) => {
              return (<div key={ i }>
                { this.props.gameState.hands[handInd].name } (Stack id: { handInd }) &nbsp;
                (Press { i } to select) &nbsp;
                { this.props.selectedTargets[0] === handInd ? <span>Selected!</span> : null }
                <KeyHandler
                  keyEventName="keydown"
                  keyValue={ i.toString() }
                  onKeyHandle={ () => this.props.recordTargetSelection(0, handInd) } />
              </div>);
            })
        }
      </div>
    );
  }

  renderSecondPhaseAction(actionInd) {
    switch (actionInd) {
      case PASS_CARDS_INDEX:
        return (
          <div>
            Which player are you passing to?
            {
              range(this._getNumPlayers())
                .filter(i => i !== this.props.playerIndex)
                .map(i => {
                  const keyBinding = (i + 1) % 10;
                  return (
                    <div key={i}>
                      Player {i + 1} (Press { keyBinding }) &nbsp;
                      { this.props.selectedTargets[0] === i ? <span>Selected!</span> : null }
                      <KeyHandler
                        keyEventName="keydown"
                        keyValue={ keyBinding.toString() }
                        onKeyHandle={ () => this.props.recordTargetSelection(0, i) } />
                    </div>
                  );
                })
            }
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