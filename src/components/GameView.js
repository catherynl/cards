import React, { Component } from 'react';
import KeyHandler from 'react-key-handler';

import Hand from './Hand';

class GameView extends Component {

  constructor(props) {
    super(props); // playerIndex, gameId, gameState, gameType, localGameState, leaveGame (callback)
  }

  _getNumPlayers() {
    return this.props.gameState.players.length;
  }

  _getPlayersToMove() {
    return this.props.gameState.playersToMove;
  }

  _getCurrentStage() {
    return this.props.gameState.currentStage;
  }

  _getNumCardsInHand(handInd) {
    if (this.props.gameState.hands[handInd] && this.props.gameState.hands[handInd].cards) {
      return this.props.gameState.hands[handInd].cards.length;
    }
    return 0;
  }

  _getValidPileIndsToDrawFrom() {
    // can only draw from nonempty table piles
    return Object.keys(this.props.gameState.hands)
            .filter(i => i >= DECK_INDEX && this._getNumCardsInHand(i) > 0)
  }

  _haveRecentlyPlayed() {
    if (this.props.gameState.hands[RECENTLY_PLAYED_INDEX + this.props.playerIndex].cards) {
      return true;
    } else {
      return false;
    }
  }

  isYourTurn() {
    return this._getPlayersToMove()[this.props.playerIndex];
  }

  haveConfirmedTrade() {
    return this.props.gameState.tradeConfirmed[this.props.playerIndex];
  }

  allHaveConfirmedTrade() {
    const tradeConfirmed = Array.from(this.props.gameState.tradeConfirmed);
    return this._getNumPlayers() === tradeConfirmed.filter(i => i).length;
  }

  // TODO: remove minPlayers from here
  shouldShowStartGameButton() {
    const minPlayersReached = (this._getNumPlayers() >= this.state.minPlayers);
    return minPlayersReached && !this.state.gameState.started;
  }

  shouldShowPlayerActions() {
    return this.isYourTurn() && !this.haveConfirmedTrade();
  }

  shouldShowGameInPlay() {
    return this.state.gameState.started && !this.state.gameState.finished;
  }

  shouldShowGameFinished() {
    return this.state.gameState.finished;
  }

  shouldShowNextStageButton() {
    return this._getCurrentStage() + 1 < this.props.gameType.getNumStages();
  }

  shouldShowEndGameButton() {
    return true; // TODO game logic
  }

  shouldShowPlayersTurnIndicator(i) {
    return this.props.gameType.getStageType(this._getCurrentStage()) === 'play' && this._getPlayersToMove()[i]
  }

  renderStartGameButton() {
    return (
      <div>
        Players so far:
        {
          this.state.gameState.players.map((player, ind) => {
            return (
              <div key={ ind }>&nbsp; { player } (Player { ind + 1 })</div>
            );
          })
        }
        <button onClick={ this.startGameClicked.bind(this) }>Start Game!</button>
      </div>
    );
  }

  renderPlayersTurnIndicator(ind) {
    const text = this.props.playerIndex === ind ? '(Your turn)' : '(This player\'s turn)';
    return <span className='turn-indicator'>{ text }</span>;
  }

  renderPlayer(ind) {
    const { gameState } = this.state;
    return (
      <div className='player' key={ ind }>
        <div className='player-name'>
          { this.shouldShowPlayersTurnIndicator(ind)
            ? this.renderPlayersTurnIndicator(ind)
            : null }
        </div>
        { gameState.hands ? this.renderHand(ind) : null }
      </div>
    );
  }

  renderRecentlyPlayed() {
    return (
      <div className='recently-played'>
        Recently played
        <br />
        { range(this._getNumPlayers()).map(i => 
          <div className='recently-played-hand'>
            Player { i + 1 }
            { this.renderHand(RECENTLY_PLAYED_INDEX + i) }
          </div>) }
      </div>
    );
  }

  renderHand(playerInd) {
    const hand = this.state.gameState.hands[playerInd];
    if (!hand) {
      return <div></div>; // to allow correct spacing
    }
    const cards = hand.cards;
    const isYours = playerInd === this.props.playerIndex;
    const isActionable = isYours && this.state.secondPhaseAction === -1;
    return (
      <div>
        <div className='hand-name'>{hand.name}</div>
        <Hand
          key={ playerInd }
          cards={ cards ? cards : [] }
          isActionable={ isActionable }
          visible={ hand.visibility[this.props.playerIndex] }
          displayMode={ hand.displayMode }
          onSelect={ isActionable ? this.onCardSelected.bind(this) : null }
          cardsSelected={ isYours ? this.state.cardsSelected : null }
        />
      </div>
    );
  }

  renderTradeConfirmed() {
    if (this.allHaveConfirmedTrade()) {
      return (
        <div>
          <div>Everyone has confirmed! See results of trade.</div>
          <button onClick={ this.nextStageClicked.bind(this) }>Next stage</button>
        </div>);
    } else if (this.haveConfirmedTrade()) {
      return (<div>{ 'Confirmed trade! Waiting for other players.' }</div>);
    } else {
      return;
    }
  }

  renderPlayerActions() {
    return (
      <div className='player-actions'>
        {
          range(Object.keys(ACTION_MAP).length)    // forces i to be a Number, not a string
            .filter(i => this.props.gameType.getActionInStage(this._getCurrentStage(), i))
            .map(i => {
              const action = ACTION_MAP[i];
              const {name, displayName} = action;
              const onClick = this[name + 'Clicked'].bind(this);
              if (this.state.secondPhaseAction === -1) {
                if (i === UNDO_PLAY_INDEX && !this._haveRecentlyPlayed()) {
                  return null; // only display "Undo play" button if recently played
                }
                return <button key={i} onClick={onClick}>{displayName}</button>;
              } else {
                if (this.state.secondPhaseAction === i) {
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
        { this.state.secondPhaseAction !== -1 ? this.renderCancelAction() : null }
        <KeyHandler keyEventName="keydown" keyValue="Enter" onKeyHandle={ this.enterPressed.bind(this) } />
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
                      { this.state.selectedTarget === i ? <span>Selected!</span> : null }
                      <KeyHandler
                        keyEventName="keydown"
                        keyValue={ keyBinding.toString() }
                        onKeyHandle={ () => this.recordTargetSelection(i) } />
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
            {
              this._getValidPileIndsToDrawFrom()
                .map((handInd, i) => {
                  return (<div key={ i }>
                    { this.state.gameState.hands[handInd].name } (Stack id: { handInd }) &nbsp;
                    (Press { i } to select) &nbsp;
                    { this.state.selectedTarget === handInd ? <span>Selected!</span> : null }
                    <KeyHandler
                      keyEventName="keydown"
                      keyValue={ i.toString() }
                      onKeyHandle={ () => this.recordTargetSelection(handInd) } />
                  </div>);
                })
            }
            How many cards would you like to draw? &nbsp;
            <input type="text" ref={ el => this.numCardsToActOn = el } placeholder="1" />
          </div>
        );
      case DISCARD_CARDS_INDEX:
        return (
          <div>
            Which pile are you discarding to?
            {
              Object.keys(this.state.gameState.hands)
                .filter(i => i >= DECK_INDEX)
                .map((handInd, i) => {
                  return (<div key={ i }>
                    { this.state.gameState.hands[handInd].name } (Stack id: { handInd }) &nbsp;
                    (Press { i } to select) &nbsp;
                    { this.state.selectedTarget === handInd ? <span>Selected!</span> : null }
                    <KeyHandler
                      keyEventName="keydown"
                      keyValue={ i.toString() }
                      onKeyHandle={ () => this.recordTargetSelection(handInd) } />
                  </div>);
                })
            }
          </div>
        );
      default:
        console.log('ERROR. invalid type of action passed to renderSecondPhaseAction.');
    }
  }

  renderCancelAction() {
    return (
      <button onClick={ this.cancelActionClicked.bind(this) }>Cancel</button>
    );
  }

  renderNonPlayerHands() {
    const hands = this.state.gameState.hands;
    return (
      <div className='non-player-hands'>
        { Object.keys(hands)
          .filter(i => i >= DECK_INDEX)
          .map(i => {
            return (<div key={ i } style={ { width: CARD_WIDTH_UI * hands.length } }>
              { this.renderHand(i) }
            </div>);
          }) }
      </div>
    );
  }

  renderStageName() {
    const stageIndex = this._getCurrentStage();
    let text;
    const stageType = this.props.gameType.getStageType(stageIndex);
    switch (stageType) {
      case 'deal':
        text = '(Anyone can deal)';
        break;
      case 'trade':
        text = '(Everyone should move)';
        break;
      case 'buffer':
        text = '(No moves on buffer mode)';
        break;
      default:
        text = '';
    }
    return (
      <div>
        Stage {stageIndex + 1}: {this.props.gameType.getStage(stageIndex).name}
        <span className='turn-indicator'> {text}</span>
      </div>
    );
  }

  renderGameInPlay() {
    return (
      <div>
        { this.renderStageName() }
        { this.renderTradeConfirmed() }
        { this.shouldShowPlayerActions() ? this.renderPlayerActions() : null }
        { this.renderPlayer(this.props.playerIndex) }
        { this.renderRecentlyPlayed() }
        { this.renderNonPlayerHands() }
        { range(this._getNumPlayers())
          .filter(i => i !== this.props.playerIndex)
          .map(ind =>
            this.renderPlayer(ind)
        )}
        { this.shouldShowNextStageButton()
          ? <button onClick={ this.nextStageClicked.bind(this) }>Next stage</button>
          : null }
        { this.shouldShowEndGameButton()
          ? <button onClick={ this.endGameClicked.bind(this) }>End game</button>
          : null }
      </div>
    );
  }

  renderGameFinished() {
    return (
      <div>
        <p>Game is finished! The winner is <span className='player-name'>player { this.state.gameState.winner }!</span></p>
        <button onClick={ this.playAgainClicked.bind(this) }>Play Again!</button>
        <button onClick={ this.leaveGameClicked.bind(this) }>Back to Home</button>
      </div>
    );
  }

  render() {
    return (
      <div className='game'>
        <div className='game-id'>
          Game ID: {this.props.gameId }
        </div>
        { !this.state.gameState.started
          ? <span>Give this id to your friends so they can join your game!</span>
          : null }
        { this.shouldShowStartGameButton() ? this.renderStartGameButton() : null }
        { this.shouldShowGameInPlay() ? this.renderGameInPlay() : null }
        { this.shouldShowGameFinished() ? this.renderGameFinished() : null }
      </div>
    );
  }
}

export default GameView;