# Viceroy

Play arbitrary multiplayer card games online with your friends!

## How To Use

To use Viceroy ([live app](https://cards-vc.firebaseapp.com/)), start a card game and have your friends join by sending them the generated game code. You can choose games from a fixed set of common games, or create your own by specifying the cards in the deck, how they should be dealt, and the available actions during the game. In this way, Viceroy is a "card game engine" that allows friends to play together online, no matter how obscure or specialized the game they want to play. Viceroy can also be a helpful platform for anyone interested in developing new card games and sharing them with others.

Viceroy does not currently implement scoring for any games, but includes game-specific chat and “shared notes” interfaces for players to communicate and keep a public ledger containing the score.

## Code Base Abstractions

In order to support many different types of card games, the Viceroy code base makes the following major abstractions:
* **Stages.** Each card game consists of various stages, such as Deal stages, Play stages, Trade stages, and/or Moderator stages. Different types of stages allow different actions from the players, and support different structures for when players are allowed to make actions, and when the results of those actions are executed.
* **Actions.** Card games consist of two major classes of actions: player actions and moderator actions. Player actions are actions that are taken by specific players, and often interact directly with players hands (e.g., playing cards when it is a player’s turn). In contrast, moderator actions are actions that must be performed, but are not player-specific, such as shuffling the deck or turning over the top card of the deck to determine the trump suit.
* **Hands/piles.** Most card games involve the concept of player hands: cards that belong to a particular player, and are often only known to that player. Viceroy extends this concept to include shared hands/piles as well; the deck is just another hand, except it doesn’t belong to any specific player, and the cards in it are hidden from view. This abstraction allows Viceroy to flexibly support games that require other specialized piles (e.g., a discard pile, or location-specific Solitaire piles).

## Viceroy currently supports:

* Decks with varying numbers of cards, including up to 6 suits, multiple decks at once, and arbitrary player-named custom cards
* Numerous player actions, including playing, discarding, and drawing cards, passing cards to other players, and revealing a player’s hand to the other players
* Single-card trick-taking logic, including trump suit support, to conveniently determine which player should move next for trick-taking games such as Hearts, Spades, 99, and Tractor
* Automated moderator actions, to support games with more complicated dealing structures (such as Texas Hold’em)
* Arbitrary player-created piles, with customizable visibility and display settings, able to support Solitaire-esque games
* Game-specific chat and shared notes interfaces, to ease communication and serve as a public ledger for the players

## Features to come:

* Built-in scoring options
* User accounts and account-specific game types

## Acknowledgments

Built with React and Firebase, at Boston Winter Hack Lodge 2018.
