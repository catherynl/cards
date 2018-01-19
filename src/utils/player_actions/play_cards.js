import { range } from 'lodash';
import { RECENTLY_PLAYED_INDEX } from '../magic_numbers';
import fire from '../../fire';

export function playCardsClicked(game) {
  const myHand = game.state.gameState.hands[game.props.playerIndex].cards;
  if (!myHand) {
    window.alert('nothing to play.');
    return;
  }
  const cardsSelected = myHand.filter((el, ind) => game.state.cardsSelected[ind]);
  if (cardsSelected.length === 0) {
    window.alert('must select at least one card to play.');
    return;
  }
  if (game._isTrickTakingStage() && game._haveRecentlyPlayed()) {
    // end of the trick has been reached, so clear recentlyPlayed
    const { hands } = game.state.gameState;
    range(game._getNumPlayers()).forEach(ind => {
      hands[RECENTLY_PLAYED_INDEX + ind].cards = [];
    });
    hands[RECENTLY_PLAYED_INDEX + game.props.playerIndex].cards = cardsSelected;
    fire.database().ref(game._getFirePrefix() + '/hands').set(hands);
  } else {
    fire.database().ref(game._getRecentlyPlayedCardsFirePrefix()).set(cardsSelected);
  }
  const remainingHand = myHand.filter((el, ind) => !game.state.cardsSelected[ind]);
  game.setState({ cardsSelected: Array(remainingHand.length).fill(false) });
  fire.database().ref(game._getFirePrefix() + '/hands/' + game.props.playerIndex + '/cards')
    .set(remainingHand);
};

export function undoPlayClicked(game) {
  const { gameState } = game.state;
  const recentlyPlayed = game._getRecentlyPlayed();
  const cardsToReplace = (recentlyPlayed && recentlyPlayed[game.props.playerIndex])
   ? recentlyPlayed[game.props.playerIndex]
   : [];
  const myHand = gameState.hands[game.props.playerIndex];
  const myCards = (myHand && myHand.cards) ? myHand.cards : [];
  const newHand = myCards.concat(cardsToReplace);
  fire.database()
    .ref(game._getFirePrefix() + '/hands/' + game.props.playerIndex + '/cards')
    .set(newHand);
  fire.database()
    .ref(game._getRecentlyPlayedCardsFirePrefix())
    .set([]);
}