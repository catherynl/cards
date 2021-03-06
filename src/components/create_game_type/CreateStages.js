import React, { Component } from 'react';
import { range } from 'lodash';

import { Suits } from '../../utils/card';
import {
  PLAYER_ACTION_MAP,
  MODERATOR_ACTION_MAP,
  STAGES,
  HANDLE_REMAINING,
  NEXT_PLAYER,
  MOVE_CARDS_INDEX,
} from '../../utils/stage';

class CreateStages extends Component {

  constructor(props) {
    super(props);  // onFinish (callback, takes stages as an argument), additionalHands
    this.state = {
      stageTypes: [],  // stage names, or false (indicating a stage that has been deleted)
      stageNames: {},
      availableActions: {},
      handleRemainingFromDeal: {},
      dealCounts: {},
      nextPlayerDuringPlay: {},
      trumpSuit: {},  // stored as strings
      moderatorActions: {},  // stageInd => list of mod actions { moderatorActionType, name, target, numCards }
    };
  }

  _getValidStageTypesWithInds() {
    const stageTypesWithInds = this.state.stageTypes.map(
      (stageType, ind) => {return { stageType: stageType, stageInd: ind }});
    return stageTypesWithInds.filter((val) => val.stageType !== false);
  }

  addStageClicked(stageType) {
    const stageInd = this.state.stageTypes.length;

    const { availableActions, stageTypes, stageNames } = this.state;
    availableActions[stageInd] = Array.from(STAGES[stageType].defaultActions);
    stageTypes.push(stageType);
    stageNames[stageInd] = '';
    let updatedState = { stageTypes, availableActions, stageNames };

    switch (stageType) {
      case 0:
        const { handleRemainingFromDeal, dealCounts } = this.state;
        handleRemainingFromDeal[stageInd] = HANDLE_REMAINING[0];
        updatedState['handleRemainingFromDeal'] = handleRemainingFromDeal;
        dealCounts[stageInd] = '';
        updatedState['dealCounts'] = dealCounts;
        break;
      case 1:
        const { nextPlayerDuringPlay, trumpSuit } = this.state;
        nextPlayerDuringPlay[stageInd] = NEXT_PLAYER[0];
        updatedState['nextPlayerDuringPlay'] = nextPlayerDuringPlay;
        trumpSuit[stageInd] = 'none';
        updatedState['trumpSuit'] = trumpSuit;
        break;
      case 2: // trade
      case 3: // buffer
        break;
      case 4:
        const { moderatorActions } = this.state;
        moderatorActions[stageInd] = [];
        updatedState['moderatorActions'] = moderatorActions;
        break;
      default:
        console.log('ERROR. invalid stage type encountered:', stageType);
    }

    this.setState(updatedState);
  }


  addModeratorActionClicked(stageInd, i) {
    const action = {
      moderatorActionType: i,
    }
    switch (i) {
      case 20: // move cards
        action.target = [0, 0]
        break;
      case 21: // shuffle pile
        action.target = [0];
        break;
      default:
        console.log('ERROR: unrecognized moderator action type');
    }
    const { moderatorActions } = this.state;
    moderatorActions[stageInd].push(action);
    this.setState({ moderatorActions });
  }

  deleteStageClicked(stageInd) {
    const { stageTypes } = this.state;
    stageTypes[stageInd] = false;
    this.setState({ stageTypes });
  }

  toggleAvailableAction(stageInd, actionKey) {
    const { availableActions } = this.state;
    availableActions[stageInd][actionKey] = !(availableActions[stageInd][actionKey]);
    this.setState({ availableActions });
  }

  stageNameChanged(stageInd, e) {
    const { stageNames } = this.state;
    stageNames[stageInd] = e.target.value;
    this.setState({ stageNames });
  }

  dealCountsChanged(stageInd, e) {
    const { dealCounts } = this.state;
    dealCounts[stageInd] = e.target.value;
    this.setState({ dealCounts });
  }

  handleRemainingChanged(stageInd, e) {
    const { handleRemainingFromDeal } = this.state;
    handleRemainingFromDeal[stageInd] = e.target.value;
    this.setState({ handleRemainingFromDeal });
  }

  nextPlayerChanged(stageInd, e) {
    const { nextPlayerDuringPlay } = this.state;
    nextPlayerDuringPlay[stageInd] = e.target.value;
    this.setState({ nextPlayerDuringPlay });
  }

  trumpSuitChanged(stageInd, e) {
    const { trumpSuit } = this.state;
    trumpSuit[stageInd] = e.target.value;
    this.setState({ trumpSuit });
  }

  moderatorActionTargetChanged(stageInd, listInd, targetInd, e) {
    const newTargetI = parseInt(e.target.value, 10);
    const { moderatorActions } = this.state;
    moderatorActions[stageInd][listInd].target[targetInd] = newTargetI;
    this.setState({ moderatorActions });
  }

  moderatorActionNumCardsChanged(stageInd, listInd, e) {
    const { moderatorActions } = this.state;
    const numCards = e.target.value;
    moderatorActions[stageInd][listInd].numCards = numCards;
    this.setState({ moderatorActions });
  }

  finishClicked() {
    const stageTypesWithInds = this._getValidStageTypesWithInds();
    const numStages = stageTypesWithInds.length;
    if (numStages === 0) {
      window.alert('must create at least one stage!');
      return;
    }

    let stages = [];
    for (let displayInd = 0; displayInd < numStages; displayInd++) {
      const stageInd = stageTypesWithInds[displayInd].stageInd;
      const stageType = stageTypesWithInds[displayInd].stageType;
      let stage = {
        name: this.state.stageNames[stageInd],
        type: STAGES[stageType].name,
        availableActions: this.state.availableActions[stageInd]
      };
      switch (stageType) {
        case 0:
          const dealCountPerPlayer = parseInt(this.state.dealCounts[stageInd], 10);
          if (Number.isNaN(dealCountPerPlayer) || dealCountPerPlayer <= 0) {
            window.alert('invalid deal count per player in stage ' + (displayInd + 1) +
                         ': ' + this.state.dealCounts[stageInd]);
            return;
          }
          stage['dealCountPerPlayer'] = dealCountPerPlayer;
          stage['handleRemaining'] = this.state.handleRemainingFromDeal[stageInd];
          break;
        case 1:
          stage['nextPlayerRules'] = this.state.nextPlayerDuringPlay[stageInd];
          if (stage['nextPlayerRules'] === 'trickTaking') {
            stage['trumpSuit'] = this.state.trumpSuit[stageInd];
          }
          break;
        case 4:
          const moderatorActions = this.state.moderatorActions[stageInd];
          for (let i in moderatorActions) {
            const action = moderatorActions[i];
            if (action.moderatorActionType === MOVE_CARDS_INDEX) {
              const numCards = parseInt(action.numCards ? action.numCards : 1, 10);
              if (Number.isNaN(numCards) || numCards <= 0) {
                window.alert('invalid number of cards to move ' + (displayInd + 1) +
                             ': ' + action.numCards);
                return;
              }
              action.numCards = numCards;
            }
          }
          stage['moderatorActions'] = moderatorActions;
          break;
        default:
          console.log('ERROR. invalid stage type encountered:', stageType);
      }
      stages.push(stage);
    }

    this.props.onFinish(stages);
  }

  shouldShowTrumpSuitInterface(stageInd) {
    return this.state.nextPlayerDuringPlay[stageInd] === 'trickTaking';
  }

  renderTrumpSuitOption(option, displayName, stageInd) {
    return (
      <div key={ option }>
        <input
          type="radio"
          value={ option }
          checked={ this.state.trumpSuit[stageInd] === option }
          onChange={ (e) => this.trumpSuitChanged(stageInd, e) }
        />{ displayName } &nbsp;
      </div>
    )
  }

  renderTrumpSuitInterface(stageInd) {
    return (
      <div>
        Does the game have a trump suit?
        { range(4).map(   // TODO: generalize to include all suits in play
          (option, ind) => this.renderTrumpSuitOption(option.toString(), Suits[option].name, stageInd)
        )}
        { this.renderTrumpSuitOption('none', 'no trump suit', stageInd) }
        { this.renderTrumpSuitOption('query', 'depends/changes game to game. ask me in game!', stageInd) }
      </div>
    );
  }

  renderAvailableActions(stageType, stageInd) {
    if (STAGES[stageType].availableActions) {
      return (
        <div>
          Available actions:
          {
            STAGES[stageType].availableActions.map( (key) =>
              <div key={ key }>
                <input
                  type="checkbox"
                  value={ PLAYER_ACTION_MAP[key].displayName }
                  checked={ this.state.availableActions[stageInd][key] }
                  onChange={ () => this.toggleAvailableAction(stageInd, key) } />
                { PLAYER_ACTION_MAP[key].displayName }
              </div>
            )
          }
        </div>
      );
    }
  }

  renderDealStageInterface(stageInd) {
    return (
      <div>
        Each player should be dealt &nbsp;
        <input
          type="text"
          onChange={ (e) => this.dealCountsChanged(stageInd, e) }
          value={ this.state.dealCounts[stageInd] } />
        cards
        <br />
        What should be done with any leftover cards?
        { HANDLE_REMAINING.map(
          (option, ind) => {
            return (
              <div key={ ind }>
                <input
                  type="radio"
                  value={ option }
                  checked={ this.state.handleRemainingFromDeal[stageInd] === option }
                  onChange={ (e) => this.handleRemainingChanged(stageInd, e) }
                />{ option } &nbsp;
              </div>
            )
          }
        )}
      </div>
    );
  }

  renderPlayStageInterface(stageInd) {
    return (
      <div>
        What rules determine whose turn comes next?
        { NEXT_PLAYER.map(
          (option, ind) => {
            return (
              <div key={ ind }>
                <input
                  type="radio"
                  value={ option }
                  checked={ this.state.nextPlayerDuringPlay[stageInd] === option }
                  onChange={ (e) => this.nextPlayerChanged(stageInd, e) }
                />{ option } &nbsp;
              </div>
            )
          }
        )}
        { this.shouldShowTrumpSuitInterface(stageInd) ? this.renderTrumpSuitInterface(stageInd) : null }
      </div>
    );
  }

  renderAddModeratorActions(stageInd) {
    return (
      <div>
        { Object.keys(MODERATOR_ACTION_MAP).map(i => parseInt(i, 10)).map( i =>
          <button key={ i } onClick={ () => this.addModeratorActionClicked(stageInd, i) }>
            Add '{ MODERATOR_ACTION_MAP[i].displayName }' action
          </button>) }
      </div>
    );
  }

  renderModeratorActionOptions(action, stageInd, listInd, targetInd, optionName) {
    // targetInd = 0 for single target or 'from', 1 for 'to'
    return (
      <li>
        { optionName }
        { this.props.additionalHands.map((hand, i) =>
          <div key={ i }>
            <input
              type='radio'
              value={ i }
              checked={ i === action.target[targetInd] }
              onChange={ (e) => this.moderatorActionTargetChanged(stageInd, listInd, targetInd, e) }
            />{ hand.name } &nbsp;
          </div>)
        }
      </li>
    );
  }

  renderModeratorActionNumberOption(action, stageInd, listInd) {
    return (
      <li>
        Number of cards to move: &nbsp;
        <input
          type="text"
          onChange={ (e) => this.moderatorActionNumCardsChanged(stageInd, listInd, e) }
          placeholder="1" />
      </li>
    );
  }

  renderModeratorActionType(action, stageInd, listInd) {
    switch (action.moderatorActionType) {
      case 20: // move cards
        return <ul>
          { this.renderModeratorActionOptions(action, stageInd, listInd, 0, 'From Target') }
          { this.renderModeratorActionOptions(action, stageInd, listInd, 1, 'To Target') }
          { this.renderModeratorActionNumberOption(action, stageInd, listInd) }
        </ul>;
      case 21: // shuffle cards in pile
        return <ul>{ this.renderModeratorActionOptions(action, stageInd, listInd, 0, 'Target') }</ul>
      default:
        console.log('ERROR: unrecognized moderator action type');
    }
  }

  renderModeratorAction(action, listInd, stageInd) {
    return (
      <ul key={ stageInd } className='moderator-action'>
        { MODERATOR_ACTION_MAP[action.moderatorActionType].displayName }
        { this.renderModeratorActionType(action, stageInd, listInd) }
      </ul>
    );
  }

  renderModeratorStageInterface(stageInd) {
    return (
      <div>
        <ul key={ 'moderator-action-list-' + stageInd } className='moderator-actions-list'>
          { this.state.moderatorActions[stageInd]
            .map((action, i) => this.renderModeratorAction(action, i, stageInd)) }
        </ul>

        { this.renderAddModeratorActions(stageInd) }
      </div>
    );
  }

  renderSpecificStageInterface(stageType, stageInd) {
    switch (stageType) {
      case 0:
        return this.renderDealStageInterface(stageInd);
      case 1:
        return this.renderPlayStageInterface(stageInd);
      case 2: // trade
      case 3: // buffer
        return null // these stages don't have extra options
      case 4:
        return this.renderModeratorStageInterface(stageInd);
      default:
        console.log('ERROR. invalid stage type encountered:', stageType);
    }
  }

  renderStageInterface(stageType, stageInd, displayInd) {
    return (
      <div>
        Stage { displayInd } ({ STAGES[stageType].displayName }) &nbsp;
        <button onClick={ () => this.deleteStageClicked(stageInd) }>Delete stage</button> 
        <br />
        Stage name: &nbsp;
        <input
          type="text"
          onChange={ (e) => this.stageNameChanged(stageInd, e) }
          value={ this.state.stageNames[stageInd] } />
        { this.renderAvailableActions(stageType, stageInd) }
        { this.renderSpecificStageInterface(stageType, stageInd) }
      </div>
    );
  }

  render() {
    return (
      <div>
        Time for the game logic! Add some stages...
        <br />
        Current stages:
        <ul>
          {
            this._getValidStageTypesWithInds().map(
              (val, ind) =>
                <li key={ ind }>
                  { this.renderStageInterface(val.stageType, val.stageInd, ind + 1) }
                </li>
            )
          }
        </ul>
        { range(Object.keys(STAGES).length).map(i =>
            <button key={ i } onClick={ () => this.addStageClicked(i) }>
              Add { STAGES[i].name } stage
            </button>
        ) }
        <br />
        <button onClick={ this.finishClicked.bind(this) }>Done adding stages!</button>
      </div>
    );
  }
}

export default CreateStages;