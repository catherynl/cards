import React, { Component } from 'react';
import { range } from 'lodash';

import {
  MODERATOR_ACTION_MAP,
  MOVE_CARDS_INDEX,
  SHUFFLE_HAND_INDEX,
  MODERATOR_ACTION_INDEX
} from '../utils/stage';
import {
  DECK_INDEX
} from '../utils/magic_numbers';

class ModeratorActions extends Component {

  // props:
  // gameState, gameType
  // secondPhaseAction, selectedTargets, numCardsToActOn, nonEmptyPileInds
  // recordTargetSelection, updateNumCardsToActOn, onCancelAction (callbacks)
  // onModeratorAction (callback, takes actionInd)

  renderPileChoices(pileInds, selectedValue, onSelect) {
    return (
      <div>
        {
          pileInds
            .map((handInd, i) => {
              return (
                <div key={ i }>
                  <input
                      type="radio"
                      value={ i }
                      checked={ selectedValue === handInd }
                      onChange={ () => onSelect(handInd) }
                    />
                  { this.props.gameState.hands[handInd].name } (Stack id: { handInd })
                </div>
              );
            })
        }
      </div>
    );
  }

  renderSecondPhaseAction(actionInd) {
    switch (actionInd) {
      case MOVE_CARDS_INDEX:
        return (
          <div>
            Pile to move from:
            { this.renderPileChoices(
                this.props.nonEmptyPileInds,
                this.props.selectedTargets[0],
                (handInd) => this.props.recordTargetSelection(0, handInd)
            )}
            Pile to move to:
            { this.renderPileChoices(
                Object.keys(this.props.gameState.hands).filter(i => i >= DECK_INDEX),
                this.props.selectedTargets[1],
                (handInd) => this.props.recordTargetSelection(1, handInd)
            )}
            How many cards would you like to move? &nbsp;
            <input
              type="text"
              value={ this.props.numCardsToActOn }
              onChange={ this.props.updateNumCardsToActOn.bind(this) }
              placeholder="1" />
          </div>
        );
      case SHUFFLE_HAND_INDEX:
        return (
          <div>
            Which pile would you like to shuffle?
            { this.renderPileChoices(
                this.props.nonEmptyPileInds,
                this.props.selectedTargets[0],
                (handInd) => this.props.recordTargetSelection(0, handInd)
            )}
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
          range(    // forces i to be a Number, not a string
            MODERATOR_ACTION_INDEX,
            MODERATOR_ACTION_INDEX + Object.keys(MODERATOR_ACTION_MAP).length
            ).map(i => {
              const action = MODERATOR_ACTION_MAP[i];
              const {displayName} = action;
              const onClick = () => this.props.onModeratorAction(i);
              if (this.props.secondPhaseAction === -1) {
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
      </div>
    );
  }
}

export default ModeratorActions;
