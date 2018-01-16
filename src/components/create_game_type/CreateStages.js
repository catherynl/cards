import React, { Component } from 'react';

import { actionMap, STAGES, HANDLE_REMAINING, NEXT_PLAYER } from '../../utils/stage';

class CreateStages extends Component {

  constructor(props) {
    super(props);   // onFinish (callback, takes stages as an argument)
    this.state = {
      stageTypes: [],
      availableActions: {},
      handleRemainingFromDeal: {},
      nextPlayerDuringPlay: {}
    };
    this.inputStageName = {}
    this.inputDealCount = {}
  }

  addStageClicked(stageType) {
    const stageInd = this.state.stageTypes.length;

    const { availableActions, stageTypes } = this.state;
    availableActions[stageInd] = Array.from(STAGES[stageType].defaultActions);
    stageTypes.push(stageType);
    let updatedState = { stageTypes, availableActions };

    switch (stageType) {
      case 0:
        const { handleRemainingFromDeal } = this.state;
        handleRemainingFromDeal[stageInd] = HANDLE_REMAINING[0];
        updatedState['handleRemainingFromDeal'] = handleRemainingFromDeal;
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

  toggleAvailableAction(stageInd, actionKey) {
    const { availableActions } = this.state;
    availableActions[stageInd][actionKey] = !(availableActions[stageInd][actionKey]);
    this.setState({ availableActions });
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
    const numStages = this.state.stageTypes.length;
    if (numStages === 0) {
      window.alert('must create at least one stage!');
      return;
    }

    let stages = [];
    for (let stageInd = 0; stageInd < numStages; stageInd++) {
      const stageType = this.state.stageTypes[stageInd];
      let stage = {
                    name: this.inputStageName[stageInd].value,
                    type: STAGES[stageType].name,
                    availableActions: this.state.availableActions[stageInd]
                  };
      switch (stageType) {
        case 0:
          const dealCountPerPlayer = parseInt(this.inputDealCount[stageInd].value, 10);
          if (Number.isNaN(dealCountPerPlayer) || dealCountPerPlayer <= 0) {
            window.alert('invalid deal count per player in stage ' + (stageInd + 1) +
                           ': ' + this.inputDealCount[stageInd].value);
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

  renderAvailableActions(stageInd) {
    return (
      <div>
        Available actions:
        {
          Object.keys(actionMap).map( (key) =>
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

  renderDealStageInterface(stageInd) {
    return (
      <div>
        Deal counter per player: &nbsp; <input type="text" ref={ el => this.inputDealCount[stageInd] = el } />
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
        { this.renderAvailableActions(stageInd) }
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

  renderStageInterface(stageType, stageInd) {
    return (
      <div>
        Stage { stageInd + 1 } ({ STAGES[stageType].displayName })
        <br />
        Stage name: &nbsp; <input type="text" ref={ el => this.inputStageName[stageInd] = el } />
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
            this.state.stageTypes.map(
              (stageType, ind) =>
                <li key={ ind }>
                  { this.renderStageInterface(stageType, ind) }
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