import React, { Component } from 'react';
import fire from '../fire';
import KeyHandler from 'react-key-handler';
import { range } from 'lodash';

import Deck from './Deck';
import Hand from './Hand';
import GameType from '../utils/GameType';
import { actionMap } from '../utils/stage';
import { RECENTLY_PLAYED_INDEX, DECK_INDEX, MAX_ABS_CARD_RANK } from '../utils/magic_numbers';

class Game extends Component {

  constructor(props) {
    super(props); // playerIndex, gameId, leaveGame (callback)
    this.state = {
      gameState: {
        started: false,
        finished: false,
        currentStage: 0,
        hands: {},
        players: [],
        tradeConfirmed: [],
        cardsToBePassed: {},
      },
      cardsSelected: [], // booleans, one for each card in this player's hand
      minPlayers: 10000, // prevents "Start Game" from being shown too early
    };
    this.gameType = 0;
  }

  _getFirePrefix() {
    return 'games/' + this.props.gameId;
  }

  _getRecentlyPlayedCardsFirePrefix() {
    return this._getFirePrefix() + '/hands/' + (RECENTLY_PLAYED_INDEX + this.props.playerIndex) + '/cards';
  }

  _getNumPlayers() {
    return this.state.gameState.players.length;
  }

  _getCurrentStage() {
    return this.state.gameState.currentStage;
  }

  _getRecentlyPlayed() {
    return range(this._getNumPlayers()).map(ind => this.state.gameState.hands[RECENTLY_PLAYED_INDEX + ind].cards);
  }

  _haveRecentlyPlayed() {
    return this.state.gameState.hands[RECENTLY_PLAYED_INDEX + this.props.playerIndex].cards;
  }

  _isTrickTakingStage() {
    return this.gameType.getIsTrickTakingInStage(this._getCurrentStage());
  }

  _getPlayersToMove() {
    return this.state.gameState.playersToMove;
  }

  getFirstStagePlayersToMove() {
    const stageType = this.gameType.getStageType(0);
    if (stageType === 'deal' || stageType === 'trade') {
      const newPlayersToMove = Array(this._getNumPlayers()).fill(true);
      fire.database()
        .ref(this._getFirePrefix() + '/playersToMove')
        .set(newPlayersToMove);
      return newPlayersToMove;
    } else {
      return this.state.gameState.playersToMove;
    }
  }

  async componentWillMount() {
    const gamesRef = fire.database().ref(this._getFirePrefix());
    const currentState = await gamesRef.once('value');
    const newGameState = Object.assign(this.state.gameState, currentState.val());

    const gameTypeRef = fire.database().ref('gameTypes/' + newGameState.gameTypeId);
    const gameType = await gameTypeRef.once('value');
    this.gameType = new GameType(gameType.val());

    newGameState.playersToMove = this.getFirstStagePlayersToMove()

    this.setState({ gameState: newGameState });
    this.setState({ minPlayers: this.gameType.getMinPlayers() });

    const listenerCallback = snapshot => {
      const { gameState } = this.state;
      gameState[snapshot.key] = snapshot.val();
      this.setState({ gameState });

      if (snapshot.key === 'tradeConfirmed') {
        const tradeConfirmed = snapshot.val();
        if (this._getNumPlayers() === tradeConfirmed.filter(i => i).length) {
          const hands = gameState.hands;
          const cardsToBePassed = gameState.cardsToBePassed;
          range(this._getNumPlayers()).forEach(i => {
            const newCards = hands[i].cards.concat(cardsToBePassed[i]);
            this.gameType.sortHand(newCards);
            hands[i].cards = newCards;
          });
          fire.database().ref(this._getFirePrefix() + '/hands').set(hands);
          this.enterNextStage();
        }
      }
    };

    const removalListenerCallback = snapshot => {
      if (snapshot.key === 'hands') {
        const { gameState } = this.state;
        gameState['hands'] = {};
        this.setState({ gameState });
      } else {
        window.alert('WARNING: a field other than "hands" has been ' +
                      'removed from the game state database: ' + snapshot.key);
      }
    };

    gamesRef.on('child_changed', listenerCallback);
    gamesRef.on('child_added', listenerCallback);
    gamesRef.on('child_removed', removalListenerCallback);
  }

  onCardSelected(cardIndex) {
    let { cardsSelected } = this.state;
    cardsSelected[cardIndex] = !(cardsSelected[cardIndex]);
    this.setState({ cardsSelected });
  }

  isYourTurn() {
    return this._getPlayersToMove()[this.props.playerIndex];
  }

  enterNextStage() {
    const nextStage = this._getCurrentStage() + 1;
    fire.database().ref(this._getFirePrefix() + '/currentStage').set(nextStage);

    let newPlayersToMove = Array(this._getNumPlayers()).fill(false);
    const stageType = this.gameType.getStageType(nextStage);
    switch (stageType) {
      case 'deal':
      case 'trade':
        newPlayersToMove = Array(this._getNumPlayers()).fill(true);
        break;
      case 'play':
        newPlayersToMove[0] = true;
        break;
      case 'buffer':
        break;
      default:
        console.log('stage unrecognized, no players to move');
    };

    fire.database()
      .ref(this._getFirePrefix() + '/playersToMove')
      .set(newPlayersToMove);
  }

  shouldShowStartGameButton() {
    const minPlayersReached = (this._getNumPlayers() >= this.state.minPlayers);
    return minPlayersReached && !this.state.gameState.started;
  }

  shouldShowPlayerActions() {
    return this.isYourTurn();
  }

  shouldShowGameInPlay() {
    return this.state.gameState.started && !this.state.gameState.finished;
  }

  shouldShowGameFinished() {
    return this.state.gameState.finished;
  }

  shouldShowNextStageButton() {
    return this._getCurrentStage() + 1 < this.gameType.getNumStages();
  }

  shouldShowEndGameButton() {
    return true; // TODO game logic
  }

  shouldShowPlayersTurnIndicator(i) {
    return this._getPlayersToMove()[i]
  }

  startGameClicked() {
    fire.database().ref(this._getFirePrefix() + '/started').set(true);
  }

  playCardsClicked() {
    const myHand = this.state.gameState.hands[this.props.playerIndex].cards;
    if (!myHand) {
      window.alert('nothing to play.');
      return;
    }
    const cardsSelected = myHand.filter((el, ind) => this.state.cardsSelected[ind]);
    if (cardsSelected.length === 0) {
      window.alert('must select at least one card to play.');
      return;
    }
    if (this._isTrickTakingStage() && this._haveRecentlyPlayed()) {
      // end of the trick has been reached, so clear recentlyPlayed
      const { hands } = this.state.gameState;
      range(this._getNumPlayers()).forEach(ind => {
        hands[RECENTLY_PLAYED_INDEX + ind].cards = [];
      });
      hands[RECENTLY_PLAYED_INDEX + this.props.playerIndex].cards = cardsSelected;
      fire.database().ref(this._getFirePrefix() + '/hands').set(hands);
    } else {
      fire.database().ref(this._getRecentlyPlayedCardsFirePrefix()).set(cardsSelected);
    }
    const remainingHand = myHand.filter((el, ind) => !this.state.cardsSelected[ind]);
    this.setState({ cardsSelected: Array(remainingHand.length).fill(false) });
    fire.database().ref(this._getFirePrefix() + '/hands/' + this.props.playerIndex + '/cards')
      .set(remainingHand);
  }

  passCardsClicked() {
    const myHand = this.state.gameState.hands[this.props.playerIndex].cards;
    if (!myHand) {
      window.alert('nothing to play.');
      return;
    }
    const selectedCards = myHand.filter((el, ind) => this.state.cardsSelected[ind]);
    if (selectedCards.length === 0) {
      window.alert('must select at least one card to pass.');
      return;
    }
    const passIndex = (this.props.playerIndex + 1) % this._getNumPlayers();
    const cardsToBePassed = this.state.gameState.cardsToBePassed;
    const newCardsToBePassed = cardsToBePassed[passIndex]
      ? cardsToBePassed[passIndex].concat(selectedCards)
      : selectedCards;

    fire.database()
      .ref(this._getFirePrefix() + '/cardsToBePassed/' + passIndex)
      .set(newCardsToBePassed);
    const remainingHand = myHand.filter((el, ind) => !this.state.cardsSelected[ind]);
    this.setState({ cardsSelected: Array(remainingHand.length).fill(false) });
    fire.database()
      .ref(this._getFirePrefix() + '/hands/' + this.props.playerIndex + '/cards')
      .set(remainingHand);
  }

  drawCardsClicked() {
    return;
  }

  endTurnClicked() {
    const nextPlayerInCycle = (this.props.playerIndex + 1) % this._getNumPlayers();
    let newPlayerToMove = nextPlayerInCycle;

    if (this._isTrickTakingStage()) {
      const recentlyPlayed = this._getRecentlyPlayed();
      const numPlayersWhoHavePlayed = recentlyPlayed.filter((val) => val).length;
      if (numPlayersWhoHavePlayed === this._getNumPlayers()) {
        // try to determine who won the trick
        const eachPlayerPlayedSingleCard = recentlyPlayed.every((val) => val.length === 1);
        if (eachPlayerPlayedSingleCard) {
          const startingSuit = recentlyPlayed[nextPlayerInCycle][0].suit;
          let maxRankOfStartingSuit = -MAX_ABS_CARD_RANK;
          let winningPlayer = -1;
          recentlyPlayed.forEach((val, ind) =>
          {
            if (val[0].suit === startingSuit) {
              const rank = this.gameType.getCardComparisonRank(val[0]);
              if (rank > maxRankOfStartingSuit) {
                maxRankOfStartingSuit = rank;
                winningPlayer = ind;
              }
            }
          });
          newPlayerToMove = winningPlayer;
        }
      }
    }

    fire.database()
      .ref(this._getFirePrefix() + '/playersToMove/' + this.props.playerIndex)
      .set(false);
    fire.database()
      .ref(this._getFirePrefix() + '/playersToMove/' + newPlayerToMove)
      .set(true);
  }

  confirmTradeClicked() {
    fire.database().ref(this._getFirePrefix() + '/tradeConfirmed/' + this.props.playerIndex).set(true);
  }

  dealCardsClicked() {
    const deck = new Deck({ cards: this.gameType.getDeck() });
    const hands = deck.deal(
      this._getNumPlayers(),
      this.gameType.getDealCountPerPlayerInStage(this._getCurrentStage()),
      this.gameType.getHandleRemainingInStage(this._getCurrentStage()));
    Object.keys(hands).forEach(i => this.gameType.sortHand(hands[i].cards));
    const numCardsInMyHand = hands[this.props.playerIndex].cards.length;
    this.setState({ cardsSelected: Array(numCardsInMyHand).fill(false) });
    // augment hands with recently played
    range(this._getNumPlayers()).forEach(i => {
      hands[RECENTLY_PLAYED_INDEX + i] = { 
        cards: [],
        displayMode: 'fan',
        visibility: Array(this._getNumPlayers()).fill(true) };
    });
    fire.database().ref(this._getFirePrefix() + '/hands').set(hands);
    this.enterNextStage();
  }

  enterPressed() {
    if (this.isYourTurn()) {
      // if at least play is a valid option, and at least one card is selected, play; else, end turn.
      const canPlayCards = this.gameType.getPlayCardsInStage(this._getCurrentStage());
      if (canPlayCards && this.state.cardsSelected.some(val => val)) {
        this.playCardsClicked();
      } else if (this.gameType.getEndTurnInStage(this._getCurrentStage())) {
        this.endTurnClicked();
      }
    }
  }

  nextStageClicked() {
    this.enterNextStage();
  }

  playAgainClicked() {
    const { gameState } = this.state;
    const resetGameState = {
      started: false,
      finished: false,
      currentStage: 0,
      hands: {},
      playersToMove: this.getFirstStagePlayersToMove()
    };
    Object.assign(gameState, resetGameState);
    fire.database().ref(this._getFirePrefix()).set(gameState);
  }

  endGameClicked() {
    const winner = Math.floor(Math.random() * this._getNumPlayers()) + 1;
    fire.database().ref(this._getFirePrefix() + '/winner').set(winner);
    fire.database().ref(this._getFirePrefix() + '/finished').set(true);
  }

  leaveGameClicked() {
    this.props.leaveGame();
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
    return <span className='your-turn'>{ text }</span>;
  }

  renderPlayer(ind) {
    const { gameState } = this.state;
    return (
      <div className='player' key={ ind }>
        <div className='player-name'>
          {'Player ' + (ind + 1) + ': ' + gameState.players[ind]}
          &nbsp;
          { this.shouldShowPlayersTurnIndicator(ind)
            ? this.renderPlayersTurnIndicator(ind)
            : null }
        </div>
        { gameState.hands ? this.renderHand(ind) : null }
        Recently played
        <br />
        { gameState.hands[RECENTLY_PLAYED_INDEX + ind]
          ? this.renderHand(RECENTLY_PLAYED_INDEX + ind)
          : null }
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
    return (
      <Hand
        key={ playerInd }
        cards={ cards ? cards : [] }
        isYours={ isYours }
        visible={ hand.visibility[this.props.playerIndex] }
        displayMode={ hand.displayMode }
        onSelect={ isYours ? this.onCardSelected.bind(this) : null }
        cardsSelected={ isYours ? this.state.cardsSelected : null }
      />
    );
  }

  renderPlayerActions() {
    return (
      <div className='player-actions'>
        {
          Object.keys(actionMap)
            .filter(i => this.gameType.getActionInStage(this._getCurrentStage(), i))
            .map(i => {
              const action = actionMap[i];
              const {name, displayName} = action;
              const onClick = this[name + 'Clicked'].bind(this);
              return <button key={i} onClick={onClick}>{displayName}</button>;
            })
        }
        <KeyHandler keyEventName="keydown" keyValue="Enter" onKeyHandle={ this.enterPressed.bind(this) } />
      </div>
    );
  }

  renderNonPlayerHands() {
    return (
      <div>
        { this.state.gameState.hands
          ? <div className='non-player-hands'>
              { Object.keys(this.state.gameState.hands)
                .filter(i => i >= DECK_INDEX)
                .map(i => {
                  return (<div key={ i }>
                    Stack id: { i }
                    { this.renderHand(i) }
                  </div>);
                }) }
            </div>
          : null }
      </div>
    );
  }

  renderStageName() {
    const stageIndex = this._getCurrentStage();
    return (
      <div>Stage {stageIndex + 1}: {this.gameType.getStage(stageIndex).name}</div>
    );
  }

  renderGameInPlay() {
    return (
      <div>
        { this.renderStageName() }
        { this.shouldShowPlayerActions() ? this.renderPlayerActions() : null }
        { range(this._getNumPlayers()).map(ind =>
          this.renderPlayer(ind)
        )}
        { this.renderNonPlayerHands() }
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

export default Game;