import React, { Component } from 'react';

import { actionMap, STAGES, HANDLE_REMAINING, NEXT_PLAYER } from '../../utils/stage';

class CreateStages extends Component {

  constructor(props) {
    super(props);   // onFinish (callback, takes stages as an argument)
    this.state = {
      stageTypes: [],  // stage names, or false (indicating a stage that has been deleted)
      stageNames: {},
      availableActions: {},
      handleRemainingFromDeal: {},
      dealCounts: {},
      nextPlayerDuringPlay: {}
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
        const { nextPlayerDuringPlay } = this.state;
        nextPlayerDuringPlay[stageInd] = NEXT_PLAYER[0];
        updatedState['nextPlayerDuringPlay'] = nextPlayerDuringPlay;
        break;
      default:
        console.log('ERROR. invalid stage type encountered:', stageType);
    }

    this.setState(updatedState);
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
          break;
        default:
          console.log('ERROR. invalid stage type encountered:', stageType);
      }
      stages.push(stage);
    }

    this.props.onFinish(stages);
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
                  value={ actionMap[key].displayName }
                  checked={ this.state.availableActions[stageInd][key] }
                  onChange={ () => this.toggleAvailableAction(stageInd, key) } />
                { actionMap[key].displayName }
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
      </div>
    );
  }

  renderSpecificStageInterface(stageType, stageInd) {
    switch (stageType) {
      case 0:
        return this.renderDealStageInterface(stageInd);
      case 1:
        return this.renderPlayStageInterface(stageInd);
      default:
        console.log('ERROR. invalid stage type encountered: ', stageType);
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
        <button onClick={ () => this.addStageClicked(0) }>Add deal stage</button>
        <button onClick={ () => this.addStageClicked(1) }>Add play stage</button>
        <br />
        <button onClick={ this.finishClicked.bind(this) }>Done adding stages!</button>
      </div>
    );
  }
}

export default CreateStages;